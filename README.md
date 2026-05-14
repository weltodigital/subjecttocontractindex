# UK Estate Agent Index

A monthly-updated ranking of UK estate agencies, scored on Google reviews. Sister site to [Subject To Contract](https://subjecttocontract.com), hosted at `index.subjecttocontract.com`.

This is the validation MVP: Brighton only. The pipeline is town-agnostic — adding a new town is one row in the `towns` table.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase (Postgres) for storage, region `eu-west-2`
- Google Places API for agency data
- Vercel for hosting + monthly cron
- Resend for transactional email (magic links, admin alerts)
- Beehiiv API for subscriber + referral verification
- `iron-session` for cookie-based sessions

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

### Required env vars

| Variable | What it's for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (read-only on RLS-protected tables) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — used by the cron + auth routes only |
| `GOOGLE_PLACES_API_KEY` | Google Cloud project with Places API enabled and billing on |
| `BEEHIIV_API_KEY` | For verifying subscriber + referral count |
| `BEEHIIV_PUBLICATION_ID` | Subject To Contract publication ID |
| `RESEND_API_KEY` | Magic-link emails + admin alerts |
| `RESEND_FROM_EMAIL` | Verified sender (default `hello@subjecttocontract.com`) |
| `ADMIN_ALERT_EMAIL` | Where refresh-failure alerts go |
| `SESSION_SECRET` | 32+ char random string for iron-session |
| `CRON_SECRET` | Vercel sends this as `Authorization: Bearer …` on the cron call |
| `ADMIN_PASSWORD` | Guards `/admin/refresh` for manual pipeline triggers |
| `NEXT_PUBLIC_BASE_URL` | `https://index.subjecttocontract.com` in prod |

## Database setup

Run the migrations against your Supabase project in order:

```bash
# In the Supabase SQL editor, paste in order:
supabase/migrations/0001_initial.sql   # core tables + Brighton seed
supabase/migrations/0002_auth.sql      # auth_tokens + subscriber_cache
```

Or via the Supabase CLI:

```bash
supabase link --project-ref <ref>
supabase db push
```

## First data pull

The cron runs on the 1st of each month at 04:00 UTC, but you need data before then for the site to display anything. Use the admin trigger:

1. Set `ADMIN_PASSWORD` in Vercel (or `.env.local` for local).
2. Visit `/admin/refresh`.
3. Enter the password and click **Run refresh**.

The job runs the same code path as the cron and is idempotent: re-running on the same date upserts snapshots rather than duplicating them.

## Cron

Vercel's `vercel.json` declares the cron:

```json
{ "crons": [{ "path": "/api/cron/refresh-index", "schedule": "0 4 1 * *" }] }
```

Vercel automatically calls this route with `Authorization: Bearer $CRON_SECRET`. The route refuses any request without that header.

## Scoring formula

Implemented in `lib/scoring.ts` and `lib/recency.ts`. Walk-through at `/methodology`.

```
ratingScore  = averageRating * 20
volumeScore  = min(100, log10(reviewCount + 1) * 33.33)
recencyScore = bucketed 0–85 from the visible 5 reviews

composite    = ratingScore * 0.6 + volumeScore * 0.2 + recencyScore * 0.2
```

Agencies under 10 reviews are stored but excluded from rankings.

## Auth (Phase 2)

Magic-link flow:

1. User submits email at `/auth/request`.
2. `POST /api/auth/request-access` checks Beehiiv subscriber status + referral count (cached 24h in `subscriber_cache`).
3. If subscriber has 1+ referrals: token written to `auth_tokens` (15-min TTL), email sent via Resend.
4. User clicks link → `GET /api/auth/verify?token=…` re-verifies Beehiiv status, marks token used, sets a 30-day iron-session cookie, redirects to `/towns/brighton`.

Preview mode is enforced page-side in `/towns/[slug]` and `/agencies/[place_id]` by reading the session and passing a `previewLimit` to the ranking table. Only rank #1 in each category remains visible; ranks 2+ have score, rating, reviews and trend blurred. This pattern keeps the SEO-visible page intact while gating value.

## Deployment

Push to a Vercel project linked to `index.subjecttocontract.com`. Set every env var in the Vercel dashboard. Vercel auto-detects Next.js, picks up `vercel.json` for the cron.

## Project structure

```
app/
  page.tsx                      # homepage + search
  towns/[slug]/page.tsx         # ranking tables + ItemList schema + OG image
  agencies/[place_id]/page.tsx  # score breakdown + sparkline + RealEstateAgent schema
  methodology/, about/          # static editorial pages
  auth/request/, auth/error/    # magic-link UX
  admin/refresh/                # manual cron trigger (password-gated)
  api/
    cron/refresh-index/         # Vercel cron entrypoint (Bearer CRON_SECRET)
    admin/refresh/              # POST { password } - same job, on-demand
    auth/request-access/        # POST { email } → magic link or status response
    auth/verify/                # GET ?token=… → session + redirect
    auth/logout/                # POST → destroys session
  components/                   # Header, Footer, RankingTable, TrendIndicator,
                                # Sparkline, ScoreBreakdown, UnlockBanner,
                                # TownSearch, StructuredData
  robots.ts, sitemap.ts         # SEO essentials, dynamic from Supabase
  not-found.tsx, error.tsx      # 404 / 500 pages
lib/
  scoring.ts                    # rating/volume/composite formulas
  recency.ts                    # 5-review bucketed approximation
  ranking.ts                    # sales_rank / lettings_rank assignment
  trend.ts                      # month-over-month trend indicator
  google-places.ts              # Text Search + Place Details, retries, rate limit
  refresh.ts                    # orchestration: town → agencies → snapshots → ranks
  queries.ts                    # read-side queries used by pages
  supabase/                     # server + service-role clients, typed schema
  beehiiv.ts                    # subscriber lookup + 24h cache
  email.ts                      # Resend magic-link template
  session.ts                    # iron-session config + helper
supabase/
  migrations/                   # 0001_initial.sql, 0002_auth.sql
vercel.json                     # cron declaration
```

## Inaccuracies / methodology questions

Email `hello@subjecttocontract.com`.
