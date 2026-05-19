import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseAnon } from '@/lib/supabase/server';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';
import { TownSearch } from '@/app/components/TownSearch';
import { StructuredData } from '@/app/components/StructuredData';

// Towns can be added between deploys. 60s ISR keeps the homepage
// statically renderable (good for SEO) while letting new towns show up
// almost immediately after a migration.
export const revalidate = 60;

const siteUrl =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://index.subjecttocontract.com';

export const metadata: Metadata = {
  title: {
    absolute: 'UK Estate Agent Index — Top Agents Ranked by Google Reviews',
  },
  description:
    'Independent monthly rankings of the best estate and letting agents across 100 UK towns, scored on Google reviews.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const db = supabaseAnon();
  const { data: towns } = await db
    .from('towns')
    .select('slug, name, county, region')
    .order('name');

  const townsByRegion = groupByRegion(towns ?? []);
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'UK Estate Agent Index',
    url: siteUrl,
    description:
      'Independent monthly rankings of UK estate and letting agents, scored on Google reviews.',
    publisher: {
      '@type': 'Organization',
      name: 'Subject To Contract',
      url: 'https://subjecttocontract.com',
    },
  };

  return (
    <>
      <StructuredData data={websiteSchema} />
      <Header />
      <main className="mx-auto max-w-page px-6 pt-16 pb-12 sm:pt-24">
        <section className="mx-auto max-w-2xl text-center">
          <h1 className="font-serif text-4xl leading-tight tracking-tight text-forest sm:text-5xl">
            Find the best estate agents in your town.
          </h1>
          <p className="mt-6 text-body-lg text-charcoal-soft">
            A monthly ranking of UK estate agencies, scored on the Google
            reviews that actually matter. Updated 1st of every month.
          </p>

          <div className="mt-10">
            <TownSearch initialTowns={towns ?? []} />
          </div>

          <p className="mt-4 text-sm text-muted">
            Covering {towns?.length ?? 0} UK towns. More added each month.
          </p>

          <p className="mt-10 text-sm">
            <Link
              href="/methodology"
              className="text-forest underline-offset-4 hover:underline"
            >
              How we score →
            </Link>
          </p>
        </section>

        {townsByRegion.length > 0 && (
          <section
            aria-labelledby="all-towns-heading"
            className="mt-24 border-t border-rule pt-16"
          >
            <h2
              id="all-towns-heading"
              className="font-serif text-2xl text-forest sm:text-3xl"
            >
              Browse estate agents by town
            </h2>
            <p className="mt-3 max-w-prose text-charcoal-soft">
              All {towns?.length ?? 0} UK towns currently in the Index, grouped
              by region.
            </p>

            <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {townsByRegion.map(({ region, towns: regionTowns }) => (
                <div key={region}>
                  <h3 className="font-serif text-lg text-forest">{region}</h3>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {regionTowns.map((t) => (
                      <li key={t.slug}>
                        <Link
                          href={`/towns/${t.slug}`}
                          className="text-charcoal-soft underline-offset-4 hover:text-forest hover:underline"
                        >
                          Estate agents in {t.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

function groupByRegion(
  towns: Array<{ slug: string; name: string; region: string | null }>,
): Array<{ region: string; towns: Array<{ slug: string; name: string }> }> {
  const groups = new Map<string, Array<{ slug: string; name: string }>>();
  for (const t of towns) {
    const key = t.region ?? 'Other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ slug: t.slug, name: t.name });
  }
  // Sort regions in a roughly geographic order, then alphabetical fallback.
  const regionOrder = [
    'London',
    'South East',
    'South West',
    'East of England',
    'East Midlands',
    'West Midlands',
    'Yorkshire and the Humber',
    'North West',
    'North East',
    'Wales',
    'Scotland',
    'Northern Ireland',
  ];
  return [...groups.entries()]
    .sort(([a], [b]) => {
      const ai = regionOrder.indexOf(a);
      const bi = regionOrder.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    })
    .map(([region, towns]) => ({ region, towns }));
}
