/**
 * Minimal Beehiiv API client + 24-hour subscriber cache.
 *
 * The cache lives in `subscriber_cache` and avoids hammering Beehiiv on every
 * login attempt. We re-verify when the cache is >24h old or when a magic link
 * is consumed (in case the user has unsubscribed in the meantime).
 */

import { supabaseService } from './supabase/server';

const BEEHIIV_BASE = 'https://api.beehiiv.com/v2';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type SubscriberStatus =
  | { kind: 'not_subscribed' }
  | { kind: 'no_referrals'; referralCount: number }
  | { kind: 'has_access'; referralCount: number };

export async function getSubscriberStatus(
  email: string,
  options: { forceRefresh?: boolean } = {},
): Promise<SubscriberStatus> {
  const db = supabaseService();
  const normalized = email.trim().toLowerCase();

  if (!options.forceRefresh) {
    const { data: cached } = await db
      .from('subscriber_cache')
      .select('*')
      .eq('email', normalized)
      .maybeSingle();

    if (cached) {
      const age = Date.now() - new Date(cached.last_verified).getTime();
      if (age < CACHE_TTL_MS) {
        return statusFromCache({
          hasAccess: cached.has_access,
          referralCount: cached.referral_count,
          subscriptionId: cached.beehiiv_subscription_id,
        });
      }
    }
  }

  const fetched = await fetchFromBeehiiv(normalized);

  await db
    .from('subscriber_cache')
    .upsert(
      {
        email: normalized,
        beehiiv_subscription_id: fetched.subscriptionId,
        referral_count: fetched.referralCount,
        has_access: fetched.hasAccess,
        last_verified: new Date().toISOString(),
      },
      { onConflict: 'email' },
    );

  return statusFromCache(fetched);
}

function statusFromCache(args: {
  hasAccess: boolean;
  referralCount: number;
  subscriptionId: string | null;
}): SubscriberStatus {
  if (!args.subscriptionId) {
    return { kind: 'not_subscribed' };
  }
  if (args.hasAccess) {
    return { kind: 'has_access', referralCount: args.referralCount };
  }
  return {
    kind: 'no_referrals',
    referralCount: args.referralCount,
  };
}

type BeehiivFetched = {
  hasAccess: boolean;
  referralCount: number;
  subscriptionId: string | null;
};

async function fetchFromBeehiiv(email: string): Promise<BeehiivFetched> {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const rawPubId = process.env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !rawPubId) {
    throw new Error('Beehiiv API not configured');
  }

  // Beehiiv expects publication IDs in the form `pub_<uuid>`. Accept either the
  // prefixed or bare form in the env var to avoid copy-paste bugs.
  const pubId = rawPubId.startsWith('pub_') ? rawPubId : `pub_${rawPubId}`;

  // expand[]=referrals returns the array of subscribers this person has
  // referred. Its length is the referral count.
  const url =
    `${BEEHIIV_BASE}/publications/${pubId}/subscriptions/by_email/` +
    `${encodeURIComponent(email)}?expand[]=referrals`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  });

  if (res.status === 404) {
    return {
      hasAccess: false,
      referralCount: 0,
      subscriptionId: null,
    };
  }

  if (!res.ok) {
    throw new Error(`Beehiiv API ${res.status}`);
  }

  const json = (await res.json()) as {
    data?: {
      id: string;
      status: string;
      referrals?: Array<{ id: string; status: string }>;
    };
  };

  const sub = json.data;
  if (!sub || sub.status !== 'active') {
    return {
      hasAccess: false,
      referralCount: 0,
      subscriptionId: null,
    };
  }

  const referralCount = sub.referrals?.length ?? 0;
  return {
    hasAccess: referralCount >= 1,
    referralCount,
    subscriptionId: sub.id,
  };
}
