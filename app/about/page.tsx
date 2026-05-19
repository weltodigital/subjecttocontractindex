import type { Metadata } from 'next';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';
import { StructuredData } from '@/app/components/StructuredData';

export const metadata: Metadata = {
  title: 'About the UK Estate Agent Index',
  description:
    'About the UK Estate Agent Index — an independent monthly ranking of UK estate and letting agencies, by Subject To Contract.',
  alternates: { canonical: '/about' },
};

const organisationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'UK Estate Agent Index',
  url: 'https://index.subjecttocontract.com',
  description:
    'Independent monthly rankings of UK estate and letting agencies, scored on Google reviews.',
  parentOrganization: {
    '@type': 'Organization',
    name: 'Subject To Contract',
    url: 'https://subjecttocontract.com',
  },
};

export default function AboutPage() {
  return (
    <>
      <StructuredData data={organisationSchema} />
      <Header />
      <main className="mx-auto max-w-prose px-6 pt-12 pb-8 sm:pt-16">
        <p className="text-sm uppercase tracking-wide text-muted">
          UK Estate Agent Index
        </p>
        <h1 className="mt-2 font-serif text-3xl text-forest sm:text-4xl">
          About the Index
        </h1>

        <p className="mt-6 text-body-lg">
          The UK Estate Agent Index is a project of{' '}
          <a
            href="https://subjecttocontract.com"
            className="text-forest underline-offset-4 hover:underline"
          >
            Subject To Contract
          </a>
          , the weekly intelligence briefing for UK property. It&apos;s a
          monthly-updated ranking of every estate and letting agency we can
          find in a given town, scored on the same public data — Google
          reviews — that prospective vendors and landlords already use.
        </p>

        <p className="mt-6 text-body-lg">
          We built it because the existing ranking tools sit behind paywalls,
          favour the agencies that pay them, or use methodologies they
          won&apos;t show you. The Index is free, the formula is on the{' '}
          <a
            href="/methodology"
            className="text-forest underline-offset-4 hover:underline"
          >
            methodology page
          </a>
          , and we update it on the 1st of every month whether anyone&apos;s
          watching or not.
        </p>

        <div className="mt-12 rounded-lg border border-rule bg-white p-6">
          <h2 className="font-serif text-xl text-forest">
            Get the weekly briefing
          </h2>
          <p className="mt-2 text-charcoal-soft">
            Subject To Contract is a free Tuesday-morning email read by estate
            agency owners, lettings directors, and proptech founders.
          </p>
          <a
            href="https://subjecttocontract.com"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-forest px-5 py-3 text-sm font-medium text-cream hover:bg-forest-soft"
          >
            Subscribe to the newsletter
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
