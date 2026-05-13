import Link from 'next/link';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';
import { TownSearch } from '@/app/components/TownSearch';
import { supabaseAnon } from '@/lib/supabase/server';

export default async function NotFound() {
  const db = supabaseAnon();
  const { data: towns } = await db
    .from('towns')
    .select('slug, name, county')
    .order('name');

  return (
    <>
      <Header />
      <main className="mx-auto max-w-prose px-6 pt-16 pb-12 sm:pt-24">
        <p className="text-sm uppercase tracking-wide text-muted">404</p>
        <h1 className="mt-2 font-serif text-3xl text-forest sm:text-4xl">
          We don&apos;t cover that town yet
        </h1>
        <p className="mt-4 text-body-lg text-charcoal-soft">
          The Index launched with Brighton. More towns are added on the 1st of
          every month. Try searching for one we cover:
        </p>
        <div className="mt-8">
          <TownSearch initialTowns={towns ?? []} />
        </div>
        <p className="mt-8 text-sm">
          <Link href="/" className="text-forest underline-offset-4 hover:underline">
            &larr; Back to home
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
