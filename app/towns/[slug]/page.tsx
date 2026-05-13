import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';
import { RankingTable } from '@/app/components/RankingTable';
import { UnlockBanner } from '@/app/components/UnlockBanner';
import { StructuredData } from '@/app/components/StructuredData';
import { getTownRanking } from '@/lib/queries';
import { getSession } from '@/lib/session';

// Auth-aware pages can't be statically cached the same way; revalidate is
// applied to the underlying data fetches via Supabase's CDN.
export const dynamic = 'force-dynamic';

const PREVIEW_LIMIT = 3;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const ranking = await getTownRanking(params.slug);
  if (!ranking) return { title: 'Town not found' };
  return {
    title: `Best Estate Agents in ${ranking.town.name}`,
    description: `Monthly ranking of estate and letting agents in ${ranking.town.name}, scored on Google reviews.`,
  };
}

export default async function TownPage({
  params,
}: {
  params: { slug: string };
}) {
  const [ranking, session] = await Promise.all([
    getTownRanking(params.slug),
    getSession(),
  ]);
  if (!ranking) notFound();
  const isAuthed = Boolean(session.email);
  const previewLimit = isAuthed ? undefined : PREVIEW_LIMIT;

  const updatedLabel = ranking.snapshotDate
    ? formatSnapshotDate(ranking.snapshotDate)
    : null;

  const itemListData = buildItemListSchema(ranking);

  return (
    <>
      <StructuredData data={itemListData} />
      <Header />
      <main className="mx-auto max-w-page px-6 pt-12 pb-8 sm:pt-16">
        <header>
          <p className="text-sm uppercase tracking-wide text-muted">
            UK Estate Agent Index
          </p>
          <h1 className="mt-2 font-serif text-3xl text-forest sm:text-4xl">
            Estate Agents in {ranking.town.name}
          </h1>
          {updatedLabel && (
            <p className="mt-2 text-sm text-charcoal-soft">
              Updated {updatedLabel}
            </p>
          )}
          {ranking.snapshotDate ? (
            <p className="mt-4 max-w-prose text-body text-charcoal-soft">
              {ranking.sales.length} sales {pluralise('agency', ranking.sales.length)} and{' '}
              {ranking.lettings.length} letting{' '}
              {pluralise('agency', ranking.lettings.length)} ranked this month.
            </p>
          ) : (
            <p className="mt-4 max-w-prose text-body text-charcoal-soft">
              No data yet for {ranking.town.name}. The first snapshot will appear after the next refresh.
            </p>
          )}
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          <RankingTable
            title="Sales Agents"
            rows={ranking.sales}
            emptyLabel="No sales agencies meet the 10-review minimum yet."
            previewLimit={previewLimit}
          />
          <RankingTable
            title="Lettings Agents"
            rows={ranking.lettings}
            emptyLabel="No letting agencies meet the 10-review minimum yet."
            previewLimit={previewLimit}
          />
        </div>

        {!isAuthed && <UnlockBanner variant="card" />}

        <p className="mt-16 text-sm">
          <Link
            href="/methodology"
            className="text-forest underline-offset-4 hover:underline"
          >
            Read our methodology &rarr;
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}

function formatSnapshotDate(snapshotDate: string): string {
  const [year, month, day] = snapshotDate.split('-').map((p) => parseInt(p, 10));
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function pluralise(word: string, n: number): string {
  if (n === 1) return word;
  if (word === 'agency') return 'agencies';
  return `${word}s`;
}

function buildItemListSchema(
  ranking: NonNullable<Awaited<ReturnType<typeof getTownRanking>>>,
) {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://index.subjecttocontract.com';
  const combined = [...ranking.sales, ...ranking.lettings];
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Best Estate Agents in ${ranking.town.name}`,
    url: `${base}/towns/${ranking.town.slug}`,
    numberOfItems: combined.length,
    itemListElement: combined.slice(0, 20).map((row, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: row.name,
      url: `${base}/agencies/${row.placeId}`,
    })),
  };
}
