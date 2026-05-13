type Point = { snapshotDate: string; compositeScore: number | null };

export function Sparkline({ points }: { points: Point[] }) {
  const usable = points.filter(
    (p): p is { snapshotDate: string; compositeScore: number } =>
      p.compositeScore != null,
  );

  if (usable.length < 2) {
    return (
      <p className="text-sm text-muted">
        Not enough history yet — score trend will appear after the next refresh.
      </p>
    );
  }

  const last6 = usable.slice(-6);
  const width = 320;
  const height = 80;
  const padding = 8;

  const scores = last6.map((p) => p.compositeScore);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const points2d = last6.map((p, i) => {
    const x = padding + (i * (width - 2 * padding)) / (last6.length - 1);
    const y =
      height - padding - ((p.compositeScore - min) / range) * (height - 2 * padding);
    return [x, y] as const;
  });

  const path = points2d
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');

  return (
    <figure className="mt-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="80"
        role="img"
        aria-label="Score history over the last 6 months"
      >
        <path d={path} fill="none" stroke="#1B4332" strokeWidth="2" />
        {points2d.map(([x, y], i) => (
          <circle
            key={last6[i].snapshotDate}
            cx={x}
            cy={y}
            r={2.5}
            fill="#1B4332"
          />
        ))}
      </svg>
      <figcaption className="mt-2 flex justify-between text-xs text-muted">
        <span>{formatShortMonth(last6[0].snapshotDate)}</span>
        <span>{formatShortMonth(last6[last6.length - 1].snapshotDate)}</span>
      </figcaption>
    </figure>
  );
}

function formatShortMonth(snapshotDate: string): string {
  const [year, month] = snapshotDate.split('-').map((p) => parseInt(p, 10));
  const d = new Date(Date.UTC(year, month - 1, 1));
  return d.toLocaleDateString('en-GB', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
}
