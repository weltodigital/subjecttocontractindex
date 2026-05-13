/**
 * Scoring formulas for the UK Estate Agent Index.
 *
 * compositeScore = ratingScore * 0.6 + volumeScore * 0.2 + recencyScore * 0.2
 *   - ratingScore:  averageRating * 20         (5.0 stars  -> 100)
 *   - volumeScore:  log10(reviewCount + 1) * 33.33, capped at 100   (~1000 reviews -> 100)
 *   - recencyScore: bucketed from the 5 most-recent reviews (see recency.ts)
 */

export const MIN_REVIEWS_FOR_RANKING = 10;

export function ratingScore(averageRating: number | null | undefined): number {
  if (!averageRating || averageRating <= 0) return 0;
  return round1(averageRating * 20);
}

export function volumeScore(reviewCount: number | null | undefined): number {
  if (!reviewCount || reviewCount <= 0) return 0;
  return round1(Math.min(100, Math.log10(reviewCount + 1) * 33.33));
}

export function compositeScore(args: {
  ratingScore: number;
  volumeScore: number;
  recencyScore: number;
}): number {
  return round1(
    args.ratingScore * 0.6 + args.volumeScore * 0.2 + args.recencyScore * 0.2,
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
