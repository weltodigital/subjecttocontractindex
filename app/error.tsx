'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/error]', error);
  }, [error]);

  return (
    <main className="mx-auto max-w-prose px-6 pt-16 pb-12 sm:pt-24">
      <p className="text-sm uppercase tracking-wide text-muted">500</p>
      <h1 className="mt-2 font-serif text-3xl text-forest sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-4 text-body-lg text-charcoal-soft">
        That&apos;s on us. We&apos;ve logged the error. Try again, or head back
        home.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-forest px-5 py-3 text-sm font-medium text-cream hover:bg-forest-soft"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-rule bg-white px-5 py-3 text-sm font-medium text-charcoal hover:border-forest"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
