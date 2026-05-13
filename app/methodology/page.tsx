import type { Metadata } from 'next';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';

export const metadata: Metadata = {
  title: 'Methodology',
  description:
    'How the UK Estate Agent Index ranks estate and letting agencies — formula, weighting, and limitations.',
};

export default function MethodologyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-prose px-6 pt-12 pb-8 sm:pt-16">
        <p className="text-sm uppercase tracking-wide text-muted">
          UK Estate Agent Index
        </p>
        <h1 className="mt-2 font-serif text-3xl text-forest sm:text-4xl">
          How we score estate agents
        </h1>
        <p className="mt-4 text-body-lg text-charcoal-soft">
          This page exists for one reason: to make the score behind every
          ranking traceable. If you can&apos;t explain how a number was
          calculated, the number isn&apos;t worth much.
        </p>

        <h2 className="mt-12 font-serif text-2xl text-forest">What we measure</h2>
        <p className="mt-3">
          Every agency in the Index has a composite score out of 100, built
          from three components:
        </p>
        <ul className="mt-4 space-y-2 pl-5 [list-style:disc]">
          <li>
            <strong className="text-forest">Rating (60%):</strong> the average
            star rating of all the agency&apos;s Google reviews. A 5.0 maps to
            100, a 4.5 to 90, a 4.0 to 80, and so on.
          </li>
          <li>
            <strong className="text-forest">Volume (20%):</strong> how many
            reviews the agency has, log-scaled so an agency with 1,000 reviews
            scores roughly 100, and 10 reviews scores around 35. The point of
            the log scale is to reward depth without rewarding sheer size
            forever.
          </li>
          <li>
            <strong className="text-forest">Recency (20%):</strong> how active
            the agency&apos;s review profile is right now. Five recent reviews
            in the last six months scores high; a dormant profile scores low.
          </li>
        </ul>

        <h2 className="mt-12 font-serif text-2xl text-forest">The formula</h2>
        <pre className="mt-4 overflow-auto rounded-md border border-rule bg-white p-5 font-mono text-sm leading-relaxed">
{`ratingScore  = averageRating * 20                   // 5.0 -> 100
volumeScore  = min(100, log10(reviewCount + 1) * 33.33)
recencyScore = bucketed from the 5 most recent reviews

compositeScore = (ratingScore * 0.6)
              + (volumeScore * 0.2)
              + (recencyScore * 0.2)`}
        </pre>

        <h2 className="mt-12 font-serif text-2xl text-forest">A worked example</h2>
        <p className="mt-3">
          Consider an agency with a 4.7 average rating, 240 reviews, and 5 of
          their most recent reviews within the last 6 months.
        </p>
        <ul className="mt-4 space-y-1 pl-5 [list-style:disc] font-mono text-sm">
          <li>ratingScore = 4.7 × 20 = 94.0</li>
          <li>volumeScore = log10(241) × 33.33 ≈ 79.4</li>
          <li>recencyScore = 85 (5/5 within 6 months)</li>
          <li>composite = 94.0 × 0.6 + 79.4 × 0.2 + 85 × 0.2 = <strong>89.3</strong></li>
        </ul>

        <h2 className="mt-12 font-serif text-2xl text-forest">What we don&apos;t measure</h2>
        <p className="mt-3">
          The Index is a public-perception signal, not a performance audit. We
          deliberately don&apos;t include:
        </p>
        <ul className="mt-4 space-y-2 pl-5 [list-style:disc]">
          <li>Sales velocity, prices achieved, fall-through rates, or any private MLS-style metrics.</li>
          <li>Customer service quality beyond what shows up in reviews.</li>
          <li>Internal performance, internal targets, or anything from an agency&apos;s own dashboards.</li>
        </ul>
        <p className="mt-3 text-charcoal-soft">
          We&apos;d like to fold some of this in eventually. For now, public
          review data is the only thing we can collect transparently for every
          UK agency on the same basis.
        </p>

        <h2 className="mt-12 font-serif text-2xl text-forest">Data source</h2>
        <ul className="mt-3 space-y-2 pl-5 [list-style:disc]">
          <li>Google Places API (Text Search + Place Details).</li>
          <li>Refreshed on the 1st of every month at 04:00 UTC.</li>
          <li>Agencies below 10 total reviews are stored but excluded from rankings.</li>
        </ul>

        <h2 className="mt-12 font-serif text-2xl text-forest">Limitations</h2>
        <ul className="mt-3 space-y-2 pl-5 [list-style:disc]">
          <li>
            <strong>Recency is an approximation.</strong> Google&apos;s API
            only returns the 5 most recent reviews per agency. We can&apos;t
            see the timestamps of older reviews. The recency score is therefore
            bucketed off those 5 — five fresh reviews in the last 6 months
            scores 85, five fresh in 12 months scores 70, and so on down to 0.
            It&apos;s a defensible proxy, not a perfect measurement.
          </li>
          <li>
            <strong>Agencies without Google Business profiles don&apos;t appear.</strong>{' '}
            If an agency doesn&apos;t maintain a Google listing, the Index
            won&apos;t see them.
          </li>
          <li>
            <strong>Multi-branch agencies appear per branch.</strong> A national
            chain with five Brighton offices will show up as five separate
            entries, each with its own score.
          </li>
          <li>
            <strong>Coverage is intentionally narrow today.</strong> The Index
            launched with Brighton as the validation MVP. More towns are added
            monthly.
          </li>
        </ul>

        <h2 className="mt-12 font-serif text-2xl text-forest">Found an error?</h2>
        <p className="mt-3">
          Email{' '}
          <a
            href="mailto:hello@subjecttocontract.com"
            className="text-forest underline-offset-4 hover:underline"
          >
            hello@subjecttocontract.com
          </a>{' '}
          if you spot something wrong. We&apos;d rather hear about it than have
          it sit on the site uncorrected.
        </p>
      </main>
      <Footer />
    </>
  );
}
