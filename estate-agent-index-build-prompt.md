# Build: UK Estate Agent Index — Brighton MVP with Auth

A monthly-updated ranking of UK estate agencies by town, scored on Google reviews. This is the validation MVP — building for ONE town (Brighton) first, then expanding to 1,500 UK towns once validated.

Hosted at `index.subjecttocontract.com` as a sister site to the main newsletter at `subjecttocontract.com`. Access to full data is gated to Subject To Contract subscribers who have referred at least 1 person.

## Build phases

Build this in three phases. Don't move to phase 2 until phase 1 works end-to-end.

- **Phase 1:** Index without auth (fully public, validates the data pipeline)
- **Phase 2:** Add magic link auth (gates premium data)
- **Phase 3:** Polish, SEO, edge cases

Confirm you understand the phasing before starting. Walk me through your plan for phase 1 before writing code.

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase for database (region: `eu-west-2`)
- Vercel for hosting + cron jobs
- Google Places API for agency data
- Resend for transactional email
- `iron-session` for cookie-based sessions
- Beehiiv API for subscriber/referral verification

## Brand styling

Match the existing Subject To Contract aesthetic:

- Background: `#FAF7F2` (cream)
- Primary: `#1B4332` (forest green)
- Body text: `#1A1A1A` (charcoal)
- Trend up: forest green
- Trend down: `#B33A3A` (muted red)
- Trend flat: charcoal
- Lora (Google Fonts, 400/500/600) for headings
- Inter (Google Fonts, 400/500/600) for body
- 16px body, 17px on desktop
- Generous whitespace, editorial feel

# PHASE 1: Index without auth

## Database schema (Supabase)

```sql
CREATE TABLE towns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  county TEXT,
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  town_id UUID REFERENCES towns(id),
  address TEXT,
  latitude FLOAT,
  longitude FLOAT,
  category TEXT CHECK (category IN ('sales', 'lettings', 'both')),
  google_profile_url TEXT,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agency_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id),
  snapshot_date DATE NOT NULL,
  average_rating FLOAT,
  review_count INTEGER,
  recent_reviews_count INTEGER,
  recency_score FLOAT,
  volume_score FLOAT,
  rating_score FLOAT,
  composite_score FLOAT,
  sales_rank INTEGER,
  lettings_rank INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agency_id, snapshot_date)
);

CREATE INDEX idx_snapshots_agency_date ON agency_snapshots(agency_id, snapshot_date DESC);
CREATE INDEX idx_agencies_town ON agencies(town_id);
CREATE INDEX idx_agencies_place_id ON agencies(google_place_id);
```

Seed `towns` with one row:
```
{ slug: 'brighton', name: 'Brighton', county: 'East Sussex', latitude: 50.8225, longitude: -0.1372 }
```

## Scoring formula

```
ratingScore = averageRating * 20            // 5.0 stars → 100
volumeScore = Math.min(100, Math.log10(reviewCount + 1) * 33.33)  // 1000 reviews → 100
recencyScore = (recentReviewsCount / reviewCount) * 100  // % reviews from last 12 months

compositeScore = (ratingScore * 0.6) + (volumeScore * 0.2) + (recencyScore * 0.2)
```

Minimum eligibility: 10 reviews total. Below this, agency is fetched and stored but excluded from rankings.

## Data collection pipeline

A Vercel cron function at `/api/cron/refresh-index` that runs on the 1st of each month at 04:00 UTC.

For each town in the `towns` table:

### Step 1: Run two text searches

```
Sales: "estate agents in {town.name}, UK"
Lettings: "letting agents in {town.name}, UK"
```

Use Google Places Text Search API. For each, capture up to 20 results (Google's max per search).

### Step 2: Categorise agencies

- Agencies appearing only in sales search → `category: 'sales'`
- Agencies appearing only in lettings search → `category: 'lettings'`
- Agencies in both → `category: 'both'`

Deduplicate by `google_place_id`.

### Step 3: Fetch Place Details

For each unique agency, call Google Place Details API with these fields:
- `name`
- `formatted_address`
- `geometry/location`
- `place_id`
- `rating`
- `user_ratings_total`
- `reviews` (returns most recent 5, with timestamps)
- `url` (Google Business profile URL)

### Step 4: Calculate recency

Google returns the 5 most recent reviews with `time` field (Unix timestamp). For an accurate `recent_reviews_count` for the last 12 months:

- If all 5 returned reviews are within the last 12 months AND the agency has >5 reviews, we can't know exactly how many of the other reviews are recent
- Approximation: if all 5 recent reviews are from the last 6 months, assume high recency. Calculate `recency_score` as:
  - If 5/5 recent reviews are within 6 months → recency_score = 85
  - If 5/5 recent reviews are within 12 months → recency_score = 70
  - If 4/5 within 12 months → recency_score = 55
  - If 3/5 within 12 months → recency_score = 40
  - If 2/5 within 12 months → recency_score = 25
  - If 1/5 within 12 months → recency_score = 10
  - If 0/5 within 12 months → recency_score = 0
- Store the count of reviews from the visible 5 that are within 12 months in `recent_reviews_count`

This is an approximation, but defensible given Google's API limitations. Document this clearly in `/methodology`.

### Step 5: Upsert into database

For each agency:
- Upsert into `agencies` table (using `google_place_id` as the unique key)
- Insert new row into `agency_snapshots` with today's date as `snapshot_date` (set to 1st of current month)
- Calculate all the scores per the formula above

### Step 6: Calculate ranks

After all snapshots inserted for the month:

For each town:
- Find all agencies with `category IN ('sales', 'both')` and snapshot for current month with `review_count >= 10`
- Order by `composite_score DESC`
- Update `sales_rank` in `agency_snapshots` (1, 2, 3...)

Repeat for lettings: `category IN ('lettings', 'both')`, update `lettings_rank`.

### Error handling

- Wrap each town in try/catch — one failed town shouldn't break the job
- Wrap each agency in try/catch — one failed agency shouldn't break the town
- Retry Google API failures up to 3 times with exponential backoff
- Log all errors to a `refresh_log` table for debugging
- If a town fails completely, send an alert email via Resend to the admin

### Rate limiting

- Google Places API has rate limits — add a 100ms delay between requests
- For Brighton MVP this won't matter; matters at scale

## Frontend routes

### `/` (homepage)

- Header: STC mark + "UK Estate Agent Index" wordmark
- Hero headline: "Find the best estate agents in your town."
- Subhead: "A monthly ranking of UK estate agencies, scored on the Google reviews that actually matter. Updated 1st of every month."
- Search bar with autocomplete (powered by towns table; for MVP only Brighton appears)
- Below search: small text "Currently covering Brighton. More towns added monthly."
- "How we score" link below
- Footer: "An independent project by Subject To Contract." with link to subjecttocontract.com

### `/towns/[slug]` (e.g., `/towns/brighton`)

Header section:
- "Estate Agents in {Town}"
- Snapshot date: "Updated 1 May 2026" (latest snapshot date for this town)
- Optional: brief intro paragraph (1-2 sentences) about the town's market — for MVP just say "{N} sales agencies and {M} letting agencies ranked this month"

Two ranking tables (side by side on desktop, stacked on mobile):

**Sales Agents** — query agencies with category IN ('sales', 'both') for this town, joined to most recent snapshot, ordered by sales_rank.

| Rank | Agency | Score | Rating | Reviews | Trend |
|------|--------|-------|--------|---------|-------|
| 1 | [Name, links to /agencies/{place_id}] | 92.3 | ⭐ 4.8 | 247 | ↑ |
| 2 | ... | ... | ... | ... | ... |

**Lettings Agents** — same format, ordered by lettings_rank.

Trend column:
- Compare composite_score from current snapshot to previous month's snapshot
- ↑ if increased by >2 points
- ↓ if decreased by >2 points
- → if change within ±2 points
- "New" if no previous month snapshot exists for this agency

Below tables: "Read our methodology" link.

### `/agencies/[place_id]`

For an individual agency:
- Name and address
- Large composite score display (e.g., "92.3 / 100")
- Star rating with stars + review count
- Categories (sales / lettings / both) shown as badges
- Score breakdown:
  - Rating score: X/100
  - Volume score: X/100
  - Recency score: X/100
- "View on Google" button → opens `google_profile_url` in new tab
- "Score history" sparkline showing last 6 months (or fewer if less data)
- "Other agencies in {Town}" link → back to town page

### `/methodology`

A plain-English explanation page. Cover:

1. **What we measure**
   - Average Google rating (60% of score)
   - Total review volume, log-scaled (20% of score)
   - Recency of recent reviews (20% of score)

2. **The formula**
   - Show the actual formula
   - Walk through an example calculation

3. **What we don't measure**
   - Sales velocity, prices achieved, win rates
   - Customer service quality beyond reviews
   - Internal performance metrics

4. **Data source**
   - Google Places API
   - Updated 1st of every month
   - Minimum 10 reviews to qualify

5. **Limitations**
   - We can only see the 5 most recent reviews per agency, so recency is an approximation
   - Some agencies may not appear if they don't have Google Business profiles
   - Multi-branch agencies appear as separate entries per branch

6. **Inaccuracies?**
   - "Email hello@subjecttocontract.com if you spot an error"

### `/about`

Two paragraphs:
- What this is (a project of Subject To Contract, the UK property newsletter)
- Why we built it (transparent, free, independently-updated alternative to existing ranking tools)
- CTA: "Subscribe to the newsletter" button → subjecttocontract.com

# PHASE 2: Magic link authentication

After phase 1 is working end-to-end with full public access to Brighton data, add authentication.

## New database tables

```sql
CREATE TABLE auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP
);

CREATE INDEX idx_tokens_token ON auth_tokens(token);
CREATE INDEX idx_tokens_email ON auth_tokens(email);

CREATE TABLE subscriber_cache (
  email TEXT PRIMARY KEY,
  beehiiv_subscription_id TEXT,
  referral_count INTEGER DEFAULT 0,
  has_access BOOLEAN DEFAULT FALSE,
  last_verified TIMESTAMP DEFAULT NOW()
);
```

The `subscriber_cache` table prevents hammering the Beehiiv API. Cache results for 24 hours.

## Auth flow

### `/auth/request` page

A simple form:
- "Enter your email to access the full Index"
- Email input
- Submit button → POSTs to `/api/auth/request-access`

### `/api/auth/request-access` (POST endpoint)

Logic:
1. Validate email format
2. Check `subscriber_cache` for this email
   - If found and `last_verified` < 24h ago: use cached values
   - Otherwise: query Beehiiv API to get subscriber data
3. Beehiiv API call: `GET https://api.beehiiv.com/v2/publications/{PUB_ID}/subscriptions/by_email/{email}` with Bearer auth
4. Determine status:
   - **Not a subscriber:** Return `{ status: 'not_subscribed' }` — frontend shows "Subscribe at subjecttocontract.com" message
   - **Subscriber, 0 referrals:** Return `{ status: 'no_referrals', referral_link: '...', referral_count: 0 }` — frontend shows "You're so close — refer just 1 colleague to unlock the Index" with their unique referral link
   - **Subscriber, 1+ referrals:** 
     - Generate a UUID token
     - Insert into `auth_tokens` with expires_at = NOW + 15 minutes
     - Send magic link email via Resend
     - Return `{ status: 'email_sent' }` — frontend shows "Check your email for a magic link"
5. Update `subscriber_cache` with latest data

### `/api/auth/verify` (GET endpoint with `?token=xxx`)

Logic:
1. Look up token in `auth_tokens`
2. If not found → redirect to `/auth/request` with error message
3. If `used = true` → redirect to `/auth/request` with "This link has already been used"
4. If `expires_at < NOW` → redirect to `/auth/request` with "This link has expired"
5. Otherwise:
   - Mark `used = true`, set `used_at = NOW`
   - Re-verify subscriber status with Beehiiv API (in case they've unsubscribed since requesting)
   - If still valid: create signed session cookie (iron-session), 30-day expiry, with payload `{ email, verified_at }`
   - Redirect to `/towns/brighton` (or wherever they were heading before auth)

### Session middleware

Create middleware at `middleware.ts` that runs on protected routes:

Protected routes:
- `/towns/[slug]` — full data requires auth
- `/agencies/[place_id]` — full profile requires auth

Public routes (always accessible):
- `/`
- `/methodology`
- `/about`
- `/auth/*`

For protected routes:
- Check session cookie
- If valid: allow through, pass email to page via header or context
- If missing/invalid: render the page in "preview mode" (see below)

### Preview mode for non-authenticated visitors

On `/towns/[slug]` for unauthenticated users:
- Show full rankings for the **top 3 agencies in each category** (sales and lettings)
- For ranks 4+, show row with name + rank visible, but **blur or hide the score, rating, and review count**
- Show a prominent CTA banner: "Unlock the full Index" → goes to `/auth/request`
- This pattern is good for SEO (search engines see the public part) and good for conversion (visible value but clear gating)

On `/agencies/[place_id]` for unauthenticated users:
- Show basic info (name, address, link to Google)
- Hide the composite score, score breakdown, and trend history
- CTA banner to unlock

## Email template (Resend)

Send from: `hello@subjecttocontract.com`

Subject: `Your access link for the UK Estate Agent Index`

HTML body should be clean, minimal, on-brand:

```
Subject To Contract logo at top

Hi,

Here's your access link for the UK Estate Agent Index.

[Big green button: "Access the Index"]

This link expires in 15 minutes and can only be used once.

If you didn't request this, you can safely ignore this email.

Cheers,
Subject To Contract
```

Also include plaintext version.

Use Resend's React Email components for the template — keeps it maintainable.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_PLACES_API_KEY=
BEEHIIV_API_KEY=
BEEHIIV_PUBLICATION_ID=
RESEND_API_KEY=
SESSION_SECRET=  # 32+ char random string for iron-session
NEXT_PUBLIC_BASE_URL=https://index.subjecttocontract.com
```

# PHASE 3: Polish, SEO, edge cases

After phases 1 and 2 work, finalise:

## SEO

- Meta titles: "Best Estate Agents in {Town} | UK Estate Agent Index"
- Meta descriptions: dynamic based on town data
- Open Graph images via Next.js OG image API — generate dynamically showing top 3 agencies for the town
- Sitemap.xml generated automatically including all town and agency pages
- robots.txt with appropriate crawl rules — allow indexing of public content, disallow `/auth/*`
- Schema.org structured data: `LocalBusiness` for agency pages, `ItemList` for town rankings
- Canonical URLs set correctly

## Error pages

- `/404` — friendly "town not found" with search bar
- `/500` — friendly error with link back to home
- `/auth/error` — for auth-specific errors

## Performance

- Lighthouse score target: 95+ on Performance and Accessibility
- All images optimised via `next/image`
- Fonts loaded via `next/font` (Lora + Inter)
- Lazy-load anything below the fold

## Mobile responsiveness

Critical — most traffic will be mobile. Test at 375px, 390px, 768px, 1024px, 1440px.

The two ranking tables should stack vertically on mobile, not try to fit side-by-side.

## Admin endpoints (basic)

A simple admin route at `/admin/refresh` (protected by a hardcoded admin password in env) that lets you manually trigger the refresh job. Useful for testing and for running the first data pull without waiting for the cron schedule.

## Logging

- Use Vercel's built-in logging for the cron job
- Log start, end, success counts, error counts
- For phase 1, console.log is fine; for phase 3, consider adding a `refresh_log` table

# Quality requirements

- All sections look polished — no awkward spacing, no text overflow
- Mobile-first responsive design
- Generous whitespace — editorial feel, not cramped data dashboard
- Typography: Lora for headings, Inter for body, no other fonts
- Forest green used confidently and consistently
- The methodology page is genuinely well-written — this is where trust is built

# Begin

Walk me through your build plan before writing any code. Confirm:

1. Your approach to the data pipeline (especially the recency approximation)
2. The folder structure you'll use
3. How you'll handle the rate limiting on Google Places API
4. Your approach to error handling in the cron job
5. The auth flow you'll implement (matching what's specified above)
6. Anything in this brief that's unclear

Then start with Phase 1, Step 1: setting up the Next.js project, Supabase schema, and the Brighton town record. Show me each piece as you build it.
