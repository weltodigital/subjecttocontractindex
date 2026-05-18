import { NextResponse } from 'next/server';
import { runRefresh } from '@/lib/refresh';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// How many towns to process per invocation. At ~17s/town in practice, 8 fits
// comfortably under Vercel Pro's 300s function timeout with margin for slow
// Google API responses. If you change MAX_TOWNS in lib/refresh.ts, sanity-
// check this against your Vercel plan's maxDuration.
const CHUNK_SIZE = 8;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expected = process.env.CRON_SECRET;

  // Vercel cron sends `Authorization: Bearer <CRON_SECRET>` automatically when
  // the env var is set. In dev or for manual hits without the header, refuse.
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

  try {
    const result = await runRefresh({ offset, limit: CHUNK_SIZE });

    if (result.hasMore && result.nextOffset !== null) {
      chainNextChunk(url, result.nextOffset, authHeader);
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/refresh-index] fatal', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Fire-and-forget self-call to start the next chunk. Vercel's serverless
// runtime may cut this short after the response is sent, but for the few
// hundred ms it takes to dispatch an HTTP request, it's reliable in practice.
// A dropped chain is recoverable on the next monthly cron via the per-town
// idempotency check.
function chainNextChunk(currentUrl: URL, nextOffset: number, auth: string): void {
  const next = new URL(currentUrl.toString());
  next.searchParams.set('offset', String(nextOffset));

  fetch(next.toString(), {
    method: 'GET',
    headers: { Authorization: auth },
    cache: 'no-store',
  }).catch((err) => {
    console.error('[cron/refresh-index] chain failed', err);
  });
}
