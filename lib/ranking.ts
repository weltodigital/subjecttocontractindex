/**
 * Rank assignment within a town and category.
 *
 * Sales rank includes agencies with category 'sales' or 'both'.
 * Lettings rank includes agencies with category 'lettings' or 'both'.
 * Only agencies with review_count >= MIN_REVIEWS_FOR_RANKING are ranked.
 */

import { MIN_REVIEWS_FOR_RANKING } from './scoring';

export type RankableSnapshot = {
  snapshotId: string;
  agencyId: string;
  category: 'sales' | 'lettings' | 'both';
  reviewCount: number;
  compositeScore: number;
};

export type RankAssignment = {
  snapshotId: string;
  salesRank: number | null;
  lettingsRank: number | null;
};

export function assignRanks(rows: RankableSnapshot[]): RankAssignment[] {
  const eligible = rows.filter(
    (r) => (r.reviewCount ?? 0) >= MIN_REVIEWS_FOR_RANKING,
  );

  const sales = eligible
    .filter((r) => r.category === 'sales' || r.category === 'both')
    .sort(byCompositeDesc);

  const lettings = eligible
    .filter((r) => r.category === 'lettings' || r.category === 'both')
    .sort(byCompositeDesc);

  const ranks = new Map<string, RankAssignment>();

  for (const row of rows) {
    ranks.set(row.snapshotId, {
      snapshotId: row.snapshotId,
      salesRank: null,
      lettingsRank: null,
    });
  }

  sales.forEach((row, idx) => {
    const r = ranks.get(row.snapshotId)!;
    r.salesRank = idx + 1;
  });

  lettings.forEach((row, idx) => {
    const r = ranks.get(row.snapshotId)!;
    r.lettingsRank = idx + 1;
  });

  return Array.from(ranks.values());
}

function byCompositeDesc(a: RankableSnapshot, b: RankableSnapshot): number {
  return b.compositeScore - a.compositeScore;
}
