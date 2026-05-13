type Row = { label: string; value: number | null; weight: string };

export function ScoreBreakdown({ rows }: { rows: Row[] }) {
  return (
    <dl className="divide-y divide-rule-soft">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between gap-4 py-3"
        >
          <dt className="text-sm text-charcoal-soft">
            {row.label}{' '}
            <span className="ml-1 text-xs text-muted">({row.weight})</span>
          </dt>
          <dd className="font-mono text-charcoal">
            {row.value != null ? `${row.value.toFixed(1)}/100` : '—'}
          </dd>
        </div>
      ))}
    </dl>
  );
}
