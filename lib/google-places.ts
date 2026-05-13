/**
 * Thin Google Places client used by the monthly refresh job.
 *
 * - Text Search: returns up to 20 results per query.
 * - Place Details: returns the 5 most-recent reviews (plus rating, count, etc).
 *
 * Built-in retry with exponential backoff (up to 3 attempts) and a 100ms
 * delay between requests to stay polite at scale.
 */

import { calculateRecency, type GoogleReview } from './recency';

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';
const REQUEST_DELAY_MS = 100;
const MAX_ATTEMPTS = 3;

export type TextSearchResult = {
  place_id: string;
  name: string;
  formatted_address?: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  googleProfileUrl: string | null;
  rating: number | null;
  reviewCount: number;
  reviews: GoogleReview[];
};

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY is not set');
  return key;
}

export async function textSearch(query: string): Promise<TextSearchResult[]> {
  const url = new URL(`${PLACES_BASE}/textsearch/json`);
  url.searchParams.set('query', query);
  url.searchParams.set('key', getApiKey());

  const data = await fetchWithRetry<{
    status: string;
    error_message?: string;
    results: TextSearchResult[];
  }>(url.toString(), 'textSearch');

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(
      `Google textSearch failed: ${data.status} - ${data.error_message ?? ''}`,
    );
  }

  return (data.results ?? []).slice(0, 20);
}

export async function placeDetails(placeId: string): Promise<PlaceDetails> {
  const url = new URL(`${PLACES_BASE}/details/json`);
  url.searchParams.set('place_id', placeId);
  url.searchParams.set(
    'fields',
    'place_id,name,formatted_address,geometry/location,rating,user_ratings_total,reviews,url',
  );
  url.searchParams.set('key', getApiKey());

  const data = await fetchWithRetry<{
    status: string;
    error_message?: string;
    result?: {
      place_id: string;
      name: string;
      formatted_address?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
      rating?: number;
      user_ratings_total?: number;
      reviews?: Array<{ time: number }>;
      url?: string;
    };
  }>(url.toString(), 'placeDetails');

  if (data.status !== 'OK' || !data.result) {
    throw new Error(
      `Google placeDetails failed for ${placeId}: ${data.status} - ${
        data.error_message ?? ''
      }`,
    );
  }

  const r = data.result;
  return {
    placeId: r.place_id,
    name: r.name,
    formattedAddress: r.formatted_address ?? null,
    latitude: r.geometry?.location?.lat ?? null,
    longitude: r.geometry?.location?.lng ?? null,
    googleProfileUrl: r.url ?? null,
    rating: r.rating ?? null,
    reviewCount: r.user_ratings_total ?? 0,
    reviews: (r.reviews ?? []).map((rev) => ({ time: rev.time })),
  };
}

export function deriveRecency(reviews: GoogleReview[]) {
  return calculateRecency(reviews);
}

async function fetchWithRetry<T>(url: string, label: string): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`${label} HTTP ${res.status}`);
      }
      const json = (await res.json()) as T;
      await delay(REQUEST_DELAY_MS);
      return json;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS) {
        await delay(250 * 2 ** (attempt - 1));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${label} failed after ${MAX_ATTEMPTS} attempts`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
