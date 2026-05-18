import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';
import { Sparkline } from '@/app/components/Sparkline';
import { ScoreBreakdown } from '@/app/components/ScoreBreakdown';
import { TrendIndicator } from '@/app/components/TrendIndicator';
import { UnlockBanner } from '@/app/components/UnlockBanner';
import { StructuredData } from '@/app/components/StructuredData';
import { getAgencyDetail } from '@/lib/queries';
import { trendFromScores } from '@/lib/trend';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { place_id: string };
}): Promise<Metadata> {
  const detail = await getAgencyDetail(params.place_id);
  if (!detail) return { title: 'Agency not found' };
  return {
    title: detail.agency.name,
    description: detail.agency.town
      ? `${detail.agency.name} in ${detail.agency.town.name} — score, rating and review history from the UK Estate Agent Index.`
      : detail.agency.name,
  };
}

export default async function AgencyPage({
  params,
}: {
  params: { place_id: string };
}) {
  const [detail, session] = await Promise.all([
    getAgencyDetail(params.place_id),
    getSession(),
  ]);
  if (!detail) notFound();
  const isAuthed = Boolean(session.email);

  const { agency, latest, previous, history } = detail;

  const trend = trendFromScores(
    latest?.compositeScore ?? null,
    previous?.compositeScore ?? null,
  );

  const structuredData = buildAgencySchema({
    agency,
    averageRating: latest?.averageRating ?? null,
    reviewCount: latest?.reviewCount ?? null,
  });

  return (
    <>
      <StructuredData data={structuredData} />
      <Header />
      <main className="mx-auto max-w-3xl px-6 pt-12 pb-8 sm:pt-16">
        <p className="text-sm uppercase tracking-wide text-muted">
          UK Estate Agent Index
        </p>
        <h1 className="mt-2 font-serif text-3xl text-forest sm:text-4xl">
          {agency.name}
        </h1>
        {agency.address && (
          <p className="mt-2 text-charcoal-soft">{agency.address}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {agency.category && (
            <CategoryBadges category={agency.category} />
          )}
        </div>

        {isAuthed ? (
          <section className="mt-10 rounded-lg border border-rule bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted">
                  Composite score
                </p>
                <p className="mt-1 font-serif text-5xl text-forest">
                  {latest?.compositeScore != null
                    ? latest.compositeScore.toFixed(1)
                    : '—'}
                  <span className="ml-1 text-xl text-muted">/100</span>
                </p>
                <div className="mt-3 flex items-center gap-3 text-sm text-charcoal-soft">
                  {latest?.averageRating != null && (
                    <span>★ {latest.averageRating.toFixed(1)}</span>
                  )}
                  {latest?.reviewCount != null && (
                    <span>· {latest.reviewCount} reviews</span>
                  )}
                  <span>
                    · <TrendIndicator trend={trend} />
                  </span>
                </div>
              </div>
              {agency.googleProfileUrl && (
                <a
                  href={agency.googleProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-forest bg-forest px-5 py-3 text-sm font-medium text-cream hover:bg-forest-soft"
                >
                  View on Google ↗
                </a>
              )}
            </div>

            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <h2 className="font-serif text-lg text-forest">Score breakdown</h2>
                <div className="mt-3">
                  <ScoreBreakdown
                    rows={[
                      {
                        label: 'Rating',
                        value: latest?.ratingScore ?? null,
                        weight: '60%',
                      },
                      {
                        label: 'Volume',
                        value: latest?.volumeScore ?? null,
                        weight: '20%',
                      },
                      {
                        label: 'Recency',
                        value: latest?.recencyScore ?? null,
                        weight: '20%',
                      },
                    ]}
                  />
                </div>
              </div>
              <div>
                <h2 className="font-serif text-lg text-forest">Score history</h2>
                <Sparkline
                  points={history.map((h) => ({
                    snapshotDate: h.snapshotDate,
                    compositeScore: h.compositeScore,
                  }))}
                />
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-10 rounded-lg border border-rule bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted">
                  Composite score
                </p>
                <p className="mt-1 font-serif text-5xl text-forest select-none blur-sm">
                  88.8<span className="ml-1 text-xl text-muted">/100</span>
                </p>
                <p className="mt-3 text-sm text-charcoal-soft">
                  Star rating, review count and trend history are hidden in
                  preview mode.
                </p>
              </div>
              {agency.googleProfileUrl && (
                <a
                  href={agency.googleProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-forest bg-forest px-5 py-3 text-sm font-medium text-cream hover:bg-forest-soft"
                >
                  View on Google ↗
                </a>
              )}
            </div>
            <UnlockBanner />
          </section>
        )}

        <section className="mt-10 rounded-lg border border-rule bg-cream p-6 sm:p-8">
          <p className="text-sm uppercase tracking-wide text-muted">
            Are you the owner of this listing?
          </p>
          <h2 className="mt-2 font-serif text-xl text-forest">
            Want to climb the rankings?
          </h2>
          <p className="mt-3 max-w-prose text-body text-charcoal-soft">
            Volume and recency together account for 40% of the composite
            score. Grow Our Reviews is the tool that helps agents capture more
            Google reviews — automated requests, smart timing, no chasing.
          </p>
          <a
            href="https://www.growourreviews.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-forest px-5 py-3 text-sm font-medium text-cream hover:bg-forest-soft"
          >
            Try Grow Our Reviews ↗
          </a>
        </section>

        {agency.town && (
          <p className="mt-12 text-sm">
            <Link
              href={`/towns/${agency.town.slug}`}
              className="text-forest underline-offset-4 hover:underline"
            >
              ← Other agencies in {agency.town.name}
            </Link>
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}

function CategoryBadges({
  category,
}: {
  category: 'sales' | 'lettings' | 'both';
}) {
  const labels =
    category === 'both' ? ['Sales', 'Lettings'] : [capitalise(category)];
  return (
    <>
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-full border border-forest/30 bg-forest/5 px-3 py-1 text-xs font-medium text-forest"
        >
          {label}
        </span>
      ))}
    </>
  );
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function buildAgencySchema(args: {
  agency: {
    name: string;
    placeId: string;
    address: string | null;
    googleProfileUrl: string | null;
    town: { slug: string; name: string } | null;
  };
  averageRating: number | null;
  reviewCount: number | null;
}) {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://index.subjecttocontract.com';
  const url = `${base}/agencies/${args.agency.placeId}`;
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: args.agency.name,
    url,
  };
  if (args.agency.address) schema.address = args.agency.address;
  if (args.agency.googleProfileUrl) schema.sameAs = args.agency.googleProfileUrl;
  if (args.agency.town) {
    schema.areaServed = {
      '@type': 'City',
      name: args.agency.town.name,
    };
  }
  if (args.averageRating != null && args.reviewCount && args.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: args.averageRating,
      reviewCount: args.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return schema;
}
