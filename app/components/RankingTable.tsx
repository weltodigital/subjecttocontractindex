import Link from 'next/link';
import { TrendIndicator } from './TrendIndicator';
import type { RankRow } from '@/lib/queries';

const TABLE_COL_COUNT = 6;

export function RankingTable({
  title,
  rows,
  emptyLabel,
  previewLimit,
}: {
  title: string;
  rows: RankRow[];
  emptyLabel: string;
  /** If set, ranks above this number are shown blurred. */
  previewLimit?: number;
}) {
  // Rank of the first gated row, if any. The unlock CTA replaces this row so
  // the prompt sits right where users hit the paywall instead of at the
  // bottom of the table.
  const firstGatedRank =
    previewLimit != null
      ? rows.find((r) => r.rank > previewLimit)?.rank ?? null
      : null;
  return (
    <section>
      <h2 className="font-serif text-2xl text-forest">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{emptyLabel}</p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-lg border border-rule bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Agency</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="hidden px-4 py-3 text-right sm:table-cell">
                  Rating
                </th>
                <th className="hidden px-4 py-3 text-right sm:table-cell">
                  Reviews
                </th>
                <th className="px-4 py-3 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-soft">
              {rows.map((row) => {
                const gated =
                  previewLimit != null && row.rank > previewLimit;
                if (gated && row.rank === firstGatedRank) {
                  return <UnlockCtaRow key={row.agencyId} rank={row.rank} />;
                }
                return (
                  <tr key={row.agencyId} className="hover:bg-cream/60">
                    <td className="px-4 py-3 font-medium text-muted">
                      {row.rank}
                    </td>
                    <td className="px-4 py-3">
                      {gated ? (
                        <span className="select-none font-medium text-charcoal-soft blur-sm">
                          {row.name}
                        </span>
                      ) : (
                        <Link
                          href={`/agencies/${row.placeId}`}
                          className="font-medium text-charcoal hover:text-forest"
                        >
                          {row.name}
                        </Link>
                      )}
                      <div className="text-xs text-muted sm:hidden">
                        {gated ? (
                          <span className="select-none blur-sm">— · — reviews</span>
                        ) : (
                          <>
                            {row.averageRating != null && (
                              <>★ {row.averageRating.toFixed(1)} · </>
                            )}
                            {row.reviewCount} reviews
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-charcoal">
                      {gated ? (
                        <span className="select-none text-muted blur-sm">
                          88.8
                        </span>
                      ) : (
                        row.compositeScore.toFixed(1)
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-right sm:table-cell">
                      {gated ? (
                        <span className="select-none text-muted blur-sm">
                          ★ 4.0
                        </span>
                      ) : row.averageRating != null ? (
                        `★ ${row.averageRating.toFixed(1)}`
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-muted sm:table-cell">
                      {gated ? (
                        <span className="select-none blur-sm">000</span>
                      ) : (
                        row.reviewCount
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {gated ? (
                        <span className="select-none text-muted blur-sm">↑</span>
                      ) : (
                        <TrendIndicator trend={row.trend} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function UnlockCtaRow({ rank }: { rank: number }) {
  return (
    <tr className="bg-forest/5">
      <td className="px-4 py-4 font-medium text-muted align-top">{rank}</td>
      <td colSpan={TABLE_COL_COUNT - 1} className="px-4 py-4">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-charcoal-soft">
            <span className="font-medium text-forest">
              Unlock the rest of the ranking.
            </span>{' '}
            Free for Subject To Contract subscribers.
          </p>
          <Link
            href="/auth/request"
            className="inline-flex items-center justify-center rounded-md bg-forest px-5 py-2.5 text-sm font-medium text-cream hover:bg-forest-soft"
          >
            Unlock the Index →
          </Link>
        </div>
      </td>
    </tr>
  );
}
