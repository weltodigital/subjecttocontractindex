import type { Metadata } from 'next';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';
import { RequestAccessForm } from './RequestAccessForm';

export const metadata: Metadata = {
  title: 'Unlock the Index',
  description: 'Magic-link access to the full UK Estate Agent Index.',
  robots: { index: false, follow: false },
};

export default function RequestAccessPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-prose px-6 pt-16 pb-12 sm:pt-24">
        <p className="text-sm uppercase tracking-wide text-muted">
          UK Estate Agent Index
        </p>
        <h1 className="mt-2 font-serif text-3xl text-forest sm:text-4xl">
          Unlock the full Index
        </h1>
        <p className="mt-4 text-body-lg text-charcoal-soft">
          Free access is included for Subject To Contract subscribers who have
          referred at least one person. Enter the email you use for the
          newsletter and we&apos;ll send you a magic link.
        </p>

        <div className="mt-10">
          <RequestAccessForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
