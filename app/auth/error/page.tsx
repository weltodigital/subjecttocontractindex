import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';

export const metadata: Metadata = {
  title: 'Access error',
  robots: { index: false, follow: false },
};

const MESSAGES: Record<string, string> = {
  missing_token: 'The link is missing a token. Please request a new one.',
  invalid: 'We couldn’t find that link. Please request a new one.',
  used: 'This link has already been used. Please request a new one.',
  expired: 'This link has expired. Please request a new one.',
  no_access:
    'Your subscriber status changed before the link was used. If you think this is wrong, get in touch.',
};

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const reason = searchParams.reason ?? 'invalid';
  const message = MESSAGES[reason] ?? MESSAGES.invalid;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-prose px-6 pt-16 pb-12 sm:pt-24">
        <p className="text-sm uppercase tracking-wide text-muted">
          UK Estate Agent Index
        </p>
        <h1 className="mt-2 font-serif text-3xl text-forest sm:text-4xl">
          Couldn&apos;t sign you in
        </h1>
        <p className="mt-4 text-body-lg text-charcoal-soft">{message}</p>
        <p className="mt-8 text-sm">
          <Link
            href="/auth/request"
            className="text-forest underline-offset-4 hover:underline"
          >
            Request a new link &rarr;
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
