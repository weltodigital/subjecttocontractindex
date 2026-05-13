/**
 * Trend indicator: compare current month composite_score to previous month.
 * Returns 'up' / 'down' / 'flat' / 'new'.
 */

export type Trend = 'up' | 'down' | 'flat' | 'new';

const FLAT_BAND = 2;

export function trendFromScores(
  current: number | null | undefined,
  previous: number | null | undefined,
): Trend {
  if (current == null) return 'flat';
  if (previous == null) return 'new';
  const delta = current - previous;
  if (delta > FLAT_BAND) return 'up';
  if (delta < -FLAT_BAND) return 'down';
  return 'flat';
}
