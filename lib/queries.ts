/**
 * Shared read-side queries against the index data.
 * Kept separate from refresh.ts so route handlers can use them cleanly.
 */

import { supabaseAnon } from './supabase/server';
import { trendFromScores, type Trend } from './trend';
import type { AgencyCategory } from './supabase/types';

export type TownRanking = {
  town: { slug: string; name: string; county: string | null };
  snapshotDate: string | null;
  sales: RankRow[];
  lettings: RankRow[];
};

export type RankRow = {
  rank: number;
  agencyId: string;
  placeId: string;
  name: string;
  compositeScore: number;
  averageRating: number | null;
  reviewCount: number;
  trend: Trend;
};

export async function getTownRanking(slug: string): Promise<TownRanking | null> {
  const db = supabaseAnon();

  const { data: town, error: townError } = await db
    .from('towns')
    .select('id, slug, name, county')
    .eq('slug', slug)
    .single();

  if (townError || !town) return null;

  const { data: latestRow } = await db
    .from('agency_snapshots')
    .select('snapshot_date, agencies!inner(town_id)')
    .eq('agencies.town_id', town.id)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .returns<Array<{ snapshot_date: string }>>();

  const snapshotDate = latestRow?.[0]?.snapshot_date ?? null;
  if (!snapshotDate) {
    return {
      town: { slug: town.slug, name: town.name, county: town.county },
      snapshotDate: null,
      sales: [],
      lettings: [],
    };
  }

  const previousDate = previousMonthDate(snapshotDate);

  type CurrentRow = {
    id: string;
    agency_id: string;
    composite_score: number | null;
    average_rating: number | null;
    review_count: number | null;
    sales_rank: number | null;
    lettings_rank: number | null;
    agencies: {
      id: string;
      google_place_id: string;
      name: string;
      town_id: string;
      category: AgencyCategory | null;
    } | null;
  };

  const { data: current } = await db
    .from('agency_snapshots')
    .select(
      'id, agency_id, composite_score, average_rating, review_count, sales_rank, lettings_rank, agencies!inner(id, google_place_id, name, town_id, category)',
    )
    .eq('snapshot_date', snapshotDate)
    .eq('agencies.town_id', town.id)
    .returns<CurrentRow[]>();

  const agencyIds = (current ?? []).map((r) => r.agency_id);
  const { data: previous } = agencyIds.length
    ? await db
        .from('agency_snapshots')
        .select('agency_id, composite_score')
        .eq('snapshot_date', previousDate)
        .in('agency_id', agencyIds)
    : { data: [] as Array<{ agency_id: string; composite_score: number | null }> };

  const prevByAgency = new Map(
    (previous ?? []).map((p) => [p.agency_id, p.composite_score]),
  );

  const sales: RankRow[] = [];
  const lettings: RankRow[] = [];

  for (const row of current ?? []) {
    const agency = Array.isArray(row.agencies) ? row.agencies[0] : row.agencies;
    if (!agency) continue;
    const trend = trendFromScores(
      row.composite_score,
      prevByAgency.get(row.agency_id) ?? null,
    );
    const base = {
      agencyId: row.agency_id,
      placeId: agency.google_place_id,
      name: agency.name,
      compositeScore: row.composite_score ?? 0,
      averageRating: row.average_rating,
      reviewCount: row.review_count ?? 0,
      trend,
    };

    if (row.sales_rank != null) {
      sales.push({ ...base, rank: row.sales_rank });
    }
    if (row.lettings_rank != null) {
      lettings.push({ ...base, rank: row.lettings_rank });
    }
  }

  sales.sort((a, b) => a.rank - b.rank);
  lettings.sort((a, b) => a.rank - b.rank);

  return {
    town: { slug: town.slug, name: town.name, county: town.county },
    snapshotDate,
    sales,
    lettings,
  };
}

export type AgencyDetail = {
  agency: {
    id: string;
    placeId: string;
    name: string;
    address: string | null;
    googleProfileUrl: string | null;
    category: AgencyCategory | null;
    town: { slug: string; name: string } | null;
  };
  latest: SnapshotPoint | null;
  history: SnapshotPoint[];
  previous: SnapshotPoint | null;
};

export type SnapshotPoint = {
  snapshotDate: string;
  compositeScore: number | null;
  ratingScore: number | null;
  volumeScore: number | null;
  recencyScore: number | null;
  averageRating: number | null;
  reviewCount: number | null;
  salesRank: number | null;
  lettingsRank: number | null;
};

export async function getAgencyDetail(
  placeId: string,
): Promise<AgencyDetail | null> {
  const db = supabaseAnon();

  type AgencyRow = {
    id: string;
    google_place_id: string;
    name: string;
    address: string | null;
    google_profile_url: string | null;
    category: AgencyCategory | null;
    town_id: string | null;
    towns: { slug: string; name: string } | { slug: string; name: string }[] | null;
  };

  const { data: agency, error } = await db
    .from('agencies')
    .select(
      'id, google_place_id, name, address, google_profile_url, category, town_id, towns(slug, name)',
    )
    .eq('google_place_id', placeId)
    .single<AgencyRow>();

  if (error || !agency) return null;

  type SnapshotRow = {
    snapshot_date: string;
    composite_score: number | null;
    rating_score: number | null;
    volume_score: number | null;
    recency_score: number | null;
    average_rating: number | null;
    review_count: number | null;
    sales_rank: number | null;
    lettings_rank: number | null;
  };

  const { data: snapshots } = await db
    .from('agency_snapshots')
    .select(
      'snapshot_date, composite_score, rating_score, volume_score, recency_score, average_rating, review_count, sales_rank, lettings_rank',
    )
    .eq('agency_id', agency.id)
    .order('snapshot_date', { ascending: false })
    .limit(12)
    .returns<SnapshotRow[]>();

  const history: SnapshotPoint[] = (snapshots ?? [])
    .map((s) => ({
      snapshotDate: s.snapshot_date,
      compositeScore: s.composite_score,
      ratingScore: s.rating_score,
      volumeScore: s.volume_score,
      recencyScore: s.recency_score,
      averageRating: s.average_rating,
      reviewCount: s.review_count,
      salesRank: s.sales_rank,
      lettingsRank: s.lettings_rank,
    }))
    .sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate));

  const latest = history.length > 0 ? history[history.length - 1] : null;
  const previous = history.length > 1 ? history[history.length - 2] : null;

  const town = Array.isArray(agency.towns) ? agency.towns[0] : agency.towns;

  return {
    agency: {
      id: agency.id,
      placeId: agency.google_place_id,
      name: agency.name,
      address: agency.address,
      googleProfileUrl: agency.google_profile_url,
      category: (agency.category ?? null) as AgencyCategory | null,
      town: town ? { slug: town.slug, name: town.name } : null,
    },
    latest,
    history,
    previous,
  };
}

function previousMonthDate(snapshotDate: string): string {
  const [year, month] = snapshotDate.split('-').map((p) => parseInt(p, 10));
  const d = new Date(Date.UTC(year, month - 1, 1));
  d.setUTCMonth(d.getUTCMonth() - 1);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}
