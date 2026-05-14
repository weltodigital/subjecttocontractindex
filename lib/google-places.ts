/**
 * Google Places API (New) client.
 *
 * Uses the v1 endpoints with X-Goog-Api-Key auth and explicit FieldMask
 * headers. Enable "Places API (New)" in the Google Cloud project.
 *
 * - Text Search: POST /v1/places:searchText (returns up to 20 places).
 * - Place Details: GET /v1/places/{place_id} (returns 5 most-recent reviews).
 *
 * Built-in retry with exponential backoff (3 attempts) and a 100ms delay
 * between requests to stay polite at scale.
 */

import { calculateRecency, type GoogleReview } from './recency';

const PLACES_BASE = 'https://places.googleapis.com/v1';
const REQUEST_DELAY_MS = 100;
const MAX_ATTEMPTS = 3;

// FieldMasks — required by the new API. Naming them locally so cost is visible.
const TEXT_SEARCH_FIELDS = 'places.id,places.displayName,places.formattedAddress';
const PLACE_DETAILS_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'reviews',
  'googleMapsUri',
].join(',');

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
  type RawPlace = {
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
  };

  const data = await fetchWithRetry<{ places?: RawPlace[] }>({
    url: `${PLACES_BASE}/places:searchText`,
    method: 'POST',
    fieldMask: TEXT_SEARCH_FIELDS,
    body: { textQuery: query, pageSize: 20, regionCode: 'GB' },
    label: 'textSearch',
  });

  return (data.places ?? []).map((p) => ({
    place_id: p.id,
    name: p.displayName?.text ?? '',
    formatted_address: p.formattedAddress,
  }));
}

export async function placeDetails(placeId: string): Promise<PlaceDetails> {
  type RawDetails = {
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    rating?: number;
    userRatingCount?: number;
    reviews?: Array<{ publishTime?: string }>;
    googleMapsUri?: string;
  };

  const data = await fetchWithRetry<RawDetails>({
    url: `${PLACES_BASE}/places/${encodeURIComponent(placeId)}`,
    method: 'GET',
    fieldMask: PLACE_DETAILS_FIELDS,
    label: 'placeDetails',
  });

  return {
    placeId: data.id,
    name: data.displayName?.text ?? '',
    formattedAddress: data.formattedAddress ?? null,
    latitude: data.location?.latitude ?? null,
    longitude: data.location?.longitude ?? null,
    googleProfileUrl: data.googleMapsUri ?? null,
    rating: data.rating ?? null,
    reviewCount: data.userRatingCount ?? 0,
    reviews: (data.reviews ?? [])
      .map((r) => parseReviewTimestamp(r.publishTime))
      .filter((t): t is GoogleReview => t !== null),
  };
}

export function deriveRecency(reviews: GoogleReview[]) {
  return calculateRecency(reviews);
}

function parseReviewTimestamp(publishTime: string | undefined): GoogleReview | null {
  if (!publishTime) return null;
  const ms = Date.parse(publishTime);
  if (Number.isNaN(ms)) return null;
  return { time: Math.floor(ms / 1000) };
}

type FetchArgs = {
  url: string;
  method: 'GET' | 'POST';
  fieldMask: string;
  body?: unknown;
  label: string;
};

async function fetchWithRetry<T>(args: FetchArgs): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(args.url, {
        method: args.method,
        headers: {
          'X-Goog-Api-Key': getApiKey(),
          'X-Goog-FieldMask': args.fieldMask,
          'Content-Type': 'application/json',
        },
        body: args.body ? JSON.stringify(args.body) : undefined,
        cache: 'no-store',
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${args.label} HTTP ${res.status}: ${errText.slice(0, 200)}`);
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
    : new Error(`${args.label} failed after ${MAX_ATTEMPTS} attempts`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
