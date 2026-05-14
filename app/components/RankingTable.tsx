import Link from 'next/link';
import { TrendIndicator } from './TrendIndicator';
import type { RankRow } from '@/lib/queries';

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
