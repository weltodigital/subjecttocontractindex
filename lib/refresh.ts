/**
 * Monthly refresh job: pulls Google Places data for every town and writes
 * a fresh snapshot per agency, then assigns ranks.
 *
 * Designed to be called from either the Vercel cron route or the /admin/refresh
 * page. One failed town shouldn't break the others; one failed agency shouldn't
 * break the town.
 */

import { Resend } from 'resend';
import {
  textSearch,
  placeDetails,
  deriveRecency,
  type TextSearchResult,
  type PlaceDetails,
} from './google-places';
import { supabaseService } from './supabase/server';
import { compositeScore, ratingScore, volumeScore } from './scoring';
import { assignRanks, type RankableSnapshot } from './ranking';
import type { AgencyCategory, Town } from './supabase/types';

export type RefreshResult = {
  startedAt: string;
  finishedAt: string;
  snapshotDate: string;
  townsAttempted: number;
  townsSucceeded: number;
  townsFailed: number;
  perTown: TownResult[];
};

export type TownResult = {
  slug: string;
  status: 'ok' | 'error';
  agenciesProcessed: number;
  agenciesFailed: number;
  error?: string;
};

export async function runRefresh(): Promise<RefreshResult> {
  const startedAt = new Date().toISOString();
  const snapshotDate = firstOfCurrentMonth();
  const db = supabaseService();

  const { data: towns, error } = await db.from('towns').select('*');
  if (error) throw new Error(`Failed to load towns: ${error.message}`);

  const perTown: TownResult[] = [];

  for (const town of towns ?? []) {
    try {
      const res = await refreshTown(town, snapshotDate);
      perTown.push(res);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await logRefresh({
        townId: town.id,
        level: 'error',
        stage: 'town',
        message,
      });
      await sendAdminAlert(town.name, message);
      perTown.push({
        slug: town.slug,
        status: 'error',
        agenciesProcessed: 0,
        agenciesFailed: 0,
        error: message,
      });
    }
  }

  const finishedAt = new Date().toISOString();
  const townsSucceeded = perTown.filter((t) => t.status === 'ok').length;

  return {
    startedAt,
    finishedAt,
    snapshotDate,
    townsAttempted: perTown.length,
    townsSucceeded,
    townsFailed: perTown.length - townsSucceeded,
    perTown,
  };
}

async function refreshTown(town: Town, snapshotDate: string): Promise<TownResult> {
  const db = supabaseService();

  await logRefresh({ townId: town.id, level: 'info', stage: 'start', message: `Refreshing ${town.name}` });

  // Step 1: two text searches
  const [salesResults, lettingsResults] = await Promise.all([
    textSearch(`estate agents in ${town.name}, UK`),
    textSearch(`letting agents in ${town.name}, UK`),
  ]);

  // Step 2: categorise + deduplicate
  const categoryByPlaceId = categorise(salesResults, lettingsResults);

  let agenciesProcessed = 0;
  let agenciesFailed = 0;

  // Step 3-5: details + scoring + upsert
  for (const [placeId, category] of categoryByPlaceId) {
    try {
      const details = await placeDetails(placeId);
      const recency = deriveRecency(details.reviews);

      const scores = {
        rating: ratingScore(details.rating),
        volume: volumeScore(details.reviewCount),
        recency: recency.recencyScore,
      };
      const composite = compositeScore({
        ratingScore: scores.rating,
        volumeScore: scores.volume,
        recencyScore: scores.recency,
      });

      const agencyId = await upsertAgency({
        details,
        townId: town.id,
        category,
      });

      await upsertSnapshot({
        agencyId,
        snapshotDate,
        rating: details.rating,
        reviewCount: details.reviewCount,
        recentReviewsCount: recency.recentReviewsCount,
        recencyScore: scores.recency,
        volumeScore: scores.volume,
        ratingScore: scores.rating,
        compositeScore: composite,
      });

      agenciesProcessed += 1;
    } catch (err) {
      agenciesFailed += 1;
      await logRefresh({
        townId: town.id,
        level: 'warn',
        stage: 'agency',
        message: err instanceof Error ? err.message : String(err),
        context: { placeId },
      });
    }
  }

  // Step 6: assign ranks for this town's snapshot
  await assignTownRanks(town.id, snapshotDate);

  await logRefresh({
    townId: town.id,
    level: 'info',
    stage: 'done',
    message: `Refreshed ${town.name}: ${agenciesProcessed} ok, ${agenciesFailed} failed`,
  });

  // If we got nothing at all, surface that as a failure
  if (agenciesProcessed === 0 && agenciesFailed > 0) {
    throw new Error(`All ${agenciesFailed} agency lookups failed in ${town.name}`);
  }

  // Mark the town as completely failed only if literally no agencies came back
  // from Google (suggests a broken API key / quota). Empty searches are also
  // suspicious but technically valid.
  const _ = db; // touch to silence noUnusedLocals if it ever lands

  return {
    slug: town.slug,
    status: 'ok',
    agenciesProcessed,
    agenciesFailed,
  };
}

function categorise(
  sales: TextSearchResult[],
  lettings: TextSearchResult[],
): Map<string, AgencyCategory> {
  const result = new Map<string, AgencyCategory>();
  const salesIds = new Set(sales.map((r) => r.place_id));
  const lettingsIds = new Set(lettings.map((r) => r.place_id));

  for (const id of salesIds) {
    result.set(id, lettingsIds.has(id) ? 'both' : 'sales');
  }
  for (const id of lettingsIds) {
    if (!result.has(id)) {
      result.set(id, 'lettings');
    }
  }
  return result;
}

async function upsertAgency(args: {
  details: PlaceDetails;
  townId: string;
  category: AgencyCategory;
}): Promise<string> {
  const db = supabaseService();
  const { data, error } = await db
    .from('agencies')
    .upsert(
      {
        google_place_id: args.details.placeId,
        name: args.details.name,
        town_id: args.townId,
        address: args.details.formattedAddress,
        latitude: args.details.latitude,
        longitude: args.details.longitude,
        category: args.category,
        google_profile_url: args.details.googleProfileUrl,
        last_updated: new Date().toISOString(),
      },
      { onConflict: 'google_place_id' },
    )
    .select('id')
    .single();

  if (error || !data) throw new Error(`upsertAgency failed: ${error?.message ?? 'no row'}`);
  return data.id;
}

async function upsertSnapshot(args: {
  agencyId: string;
  snapshotDate: string;
  rating: number | null;
  reviewCount: number;
  recentReviewsCount: number;
  recencyScore: number;
  volumeScore: number;
  ratingScore: number;
  compositeScore: number;
}): Promise<void> {
  const db = supabaseService();
  const { error } = await db.from('agency_snapshots').upsert(
    {
      agency_id: args.agencyId,
      snapshot_date: args.snapshotDate,
      average_rating: args.rating,
      review_count: args.reviewCount,
      recent_reviews_count: args.recentReviewsCount,
      recency_score: args.recencyScore,
      volume_score: args.volumeScore,
      rating_score: args.ratingScore,
      composite_score: args.compositeScore,
    },
    { onConflict: 'agency_id,snapshot_date' },
  );
  if (error) throw new Error(`upsertSnapshot failed: ${error.message}`);
}

async function assignTownRanks(townId: string, snapshotDate: string): Promise<void> {
  const db = supabaseService();

  type JoinedRow = {
    id: string;
    agency_id: string;
    review_count: number | null;
    composite_score: number | null;
    agencies: { town_id: string | null; category: AgencyCategory | null } | null;
  };

  const { data, error } = await db
    .from('agency_snapshots')
    .select('id, agency_id, review_count, composite_score, agencies!inner(town_id, category)')
    .eq('snapshot_date', snapshotDate)
    .eq('agencies.town_id', townId)
    .returns<JoinedRow[]>();

  if (error) throw new Error(`assignTownRanks read failed: ${error.message}`);
  if (!data) return;

  const rankable: RankableSnapshot[] = data.map((row) => {
    const agency = Array.isArray(row.agencies) ? row.agencies[0] : row.agencies;
    return {
      snapshotId: row.id,
      agencyId: row.agency_id,
      category: (agency?.category ?? 'sales') as AgencyCategory,
      reviewCount: row.review_count ?? 0,
      compositeScore: row.composite_score ?? 0,
    };
  });

  const assignments = assignRanks(rankable);

  // Write back ranks. Supabase has no bulk update across different rows in one
  // call without a custom RPC, so we do per-row updates. For Brighton this is
  // ~40 rows — fine. At national scale, switch to an RPC.
  for (const a of assignments) {
    const { error: updateError } = await db
      .from('agency_snapshots')
      .update({ sales_rank: a.salesRank, lettings_rank: a.lettingsRank })
      .eq('id', a.snapshotId);
    if (updateError) {
      await logRefresh({
        townId,
        level: 'warn',
        stage: 'rank',
        message: updateError.message,
        context: { snapshotId: a.snapshotId },
      });
    }
  }
}

async function logRefresh(args: {
  townId: string | null;
  level: 'info' | 'warn' | 'error';
  stage: string;
  message: string;
  context?: Record<string, unknown>;
}): Promise<void> {
  const db = supabaseService();
  await db.from('refresh_log').insert({
    town_id: args.townId,
    level: args.level,
    stage: args.stage,
    message: args.message,
    context: args.context ?? null,
  });
  if (args.level === 'error') {
    console.error('[refresh]', args.stage, args.message, args.context ?? '');
  } else {
    console.log('[refresh]', args.stage, args.message);
  }
}

async function sendAdminAlert(townName: string, errorMessage: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_ALERT_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL ?? 'hello@subjecttocontract.com';
  if (!apiKey || !to) return;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: `UK Estate Agent Index <${from}>`,
      to,
      subject: `[Index] Refresh failed for ${townName}`,
      text: `The monthly refresh for ${townName} failed with: ${errorMessage}`,
    });
  } catch (err) {
    console.error('[refresh] admin alert failed', err);
  }
}

function firstOfCurrentMonth(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}
