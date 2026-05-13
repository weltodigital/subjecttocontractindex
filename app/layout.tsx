import type { Metadata, Viewport } from 'next';
import { Inter, Lora } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-lora',
  display: 'swap',
});

const siteUrl =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://index.subjecttocontract.com';
const title = 'UK Estate Agent Index';
const description =
  'A monthly ranking of UK estate agencies, scored on the Google reviews that actually matter. An independent project by Subject To Contract.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s | UK Estate Agent Index',
  },
  description,
  applicationName: title,
  authors: [{ name: 'Subject To Contract' }],
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: title,
    title,
    description,
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#1B4332',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${lora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
