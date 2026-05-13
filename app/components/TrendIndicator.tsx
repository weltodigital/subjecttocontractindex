import type { Trend } from '@/lib/trend';

export function TrendIndicator({ trend }: { trend: Trend }) {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-1 text-forest" aria-label="trending up">
        <span aria-hidden>↑</span>
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center gap-1 text-muted-red" aria-label="trending down">
        <span aria-hidden>↓</span>
      </span>
    );
  }
  if (trend === 'new') {
    return (
      <span className="rounded-full bg-forest/10 px-2 py-0.5 text-xs font-medium text-forest">
        New
      </span>
    );
  }
  return (
    <span className="text-muted" aria-label="trend flat">
      <span aria-hidden>→</span>
    </span>
  );
}
