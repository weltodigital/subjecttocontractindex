import Link from 'next/link';

export function UnlockBanner({
  variant = 'inline',
}: {
  variant?: 'inline' | 'card';
}) {
  if (variant === 'card') {
    return (
      <section className="mt-10 rounded-lg border border-forest/20 bg-forest/5 p-6">
        <h2 className="font-serif text-xl text-forest">
          Unlock the full Index
        </h2>
        <p className="mt-2 text-charcoal-soft">
          Free for Subject To Contract subscribers who have referred at least
          one person. No payment, no spam.
        </p>
        <Link
          href="/auth/request"
          className="mt-5 inline-flex items-center justify-center rounded-md bg-forest px-5 py-3 text-sm font-medium text-cream hover:bg-forest-soft"
        >
          Unlock the Index &rarr;
        </Link>
      </section>
    );
  }

  return (
    <div className="mt-8 flex flex-col items-start gap-3 rounded-lg border border-forest/20 bg-forest/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-charcoal-soft">
        Unlock the full ranking, score breakdowns, and trend history.
      </p>
      <Link
        href="/auth/request"
        className="inline-flex items-center justify-center rounded-md bg-forest px-5 py-2.5 text-sm font-medium text-cream hover:bg-forest-soft"
      >
        Unlock the Index
      </Link>
    </div>
  );
}
