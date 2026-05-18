import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule-soft">
      <div className="mx-auto flex max-w-page flex-col gap-3 px-6 py-10 text-sm text-charcoal-soft sm:flex-row sm:items-center sm:justify-between">
        <p>
          An independent project by{' '}
          <a
            href="https://subjecttocontract.com"
            className="text-forest underline-offset-2 hover:underline"
          >
            Subject To Contract
          </a>
          .
        </p>
        <div className="flex gap-5">
          <Link href="/methodology" className="hover:text-forest">
            Methodology
          </Link>
          <Link href="/about" className="hover:text-forest">
            About
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-page px-6 pb-8 text-xs text-muted">
        <p>
          Volume and recency drive 40% of every Index score.{' '}
          <a
            href="https://www.growourreviews.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest underline-offset-2 hover:underline"
          >
            Grow Our Reviews
          </a>{' '}
          helps agents capture more Google reviews ↗
        </p>
      </div>
    </footer>
  );
}
