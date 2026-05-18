import type { MetadataRoute } from 'next';
import { supabaseAnon } from '@/lib/supabase/server';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://index.subjecttocontract.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/methodology`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.4 },
  ];

  try {
    const db = supabaseAnon();
    const { data: towns } = await db.from('towns').select('slug');
    const { data: agencies } = await db
      .from('agencies')
      .select('google_place_id')
      .limit(5000);

    const townRoutes: MetadataRoute.Sitemap = (towns ?? []).map((t) => ({
      url: `${base}/towns/${t.slug}`,
      changeFrequency: 'monthly',
      priority: 0.8,
    }));

    const agencyRoutes: MetadataRoute.Sitemap = (agencies ?? []).map((a) => ({
      url: `${base}/agencies/${a.google_place_id}`,
      changeFrequency: 'monthly',
      priority: 0.5,
    }));

    return [...staticRoutes, ...townRoutes, ...agencyRoutes];
  } catch (err) {
    console.error('[sitemap] failed to load dynamic routes', err);
    return staticRoutes;
  }
}
