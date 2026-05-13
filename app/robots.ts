import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://index.subjecttocontract.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/auth/', '/api/', '/admin/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
