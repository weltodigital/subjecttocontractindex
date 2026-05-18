import Link from 'next/link';
import { supabaseAnon } from '@/lib/supabase/server';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';
import { TownSearch } from '@/app/components/TownSearch';

// Towns can be added between deploys. 60s ISR keeps the homepage
// statically renderable (good for SEO) while letting new towns show up
// almost immediately after a migration.
export const revalidate = 60;

export default async function HomePage() {
  const db = supabaseAnon();
  const { data: towns } = await db
    .from('towns')
    .select('slug, name, county')
    .order('name');

  return (
    <>
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
            Currently covering Brighton. More towns added monthly.
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
      </main>
      <Footer />
    </>
  );
}
