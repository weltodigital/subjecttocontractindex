/**
 * Recency approximation.
 *
 * Google Place Details returns up to 5 reviews, sorted by Google's
 * "relevance" algorithm (not strictly chronological). We bucket the
 * recency_score off how many of those 5 fall inside specific windows —
 * a defensible proxy for how active the profile is right now.
 * Limitation documented on /methodology.
 */

export type GoogleReview = {
  time: number; // unix seconds
};

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const SIX_MONTHS_SECONDS = 60 * 60 * 24 * 182;

export function calculateRecency(
  reviews: GoogleReview[] | null | undefined,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): { recencyScore: number; recentReviewsCount: number } {
  if (!reviews || reviews.length === 0) {
    return { recencyScore: 0, recentReviewsCount: 0 };
  }

  let within12Months = 0;
  let within6Months = 0;

  for (const review of reviews) {
    const age = nowSeconds - review.time;
    if (age <= ONE_YEAR_SECONDS) within12Months += 1;
    if (age <= SIX_MONTHS_SECONDS) within6Months += 1;
  }

  // Per the brief: 5/5 within 6mo gets the top bucket, otherwise score by
  // count within 12 months.
  let recencyScore: number;
  if (within6Months === 5 && reviews.length >= 5) {
    recencyScore = 85;
  } else {
    recencyScore = bucketFromCount(within12Months);
  }

  return { recencyScore, recentReviewsCount: within12Months };
}

function bucketFromCount(count: number): number {
  switch (count) {
    case 5:
      return 70;
    case 4:
      return 55;
    case 3:
      return 40;
    case 2:
      return 25;
    case 1:
      return 10;
    default:
      return 0;
  }
}
