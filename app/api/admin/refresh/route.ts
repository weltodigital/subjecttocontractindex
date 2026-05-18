import { NextResponse } from 'next/server';
import { runRefresh } from '@/lib/refresh';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Same chunk size as the cron route (see comment there for the sizing logic).
const CHUNK_SIZE = 8;

export async function POST(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return NextResponse.json({ error: 'admin disabled' }, { status: 503 });
  }

  let body: { password?: string; force?: boolean; offset?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  if (body.password !== password) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const force = body.force === true;
  const offset = typeof body.offset === 'number' ? body.offset : 0;

  try {
    const result = await runRefresh({ force, offset, limit: CHUNK_SIZE });

    if (result.hasMore && result.nextOffset !== null) {
      chainNextChunk(request.url, { password, force, offset: result.nextOffset });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Fire-and-forget self-call to start the next chunk. The admin password
// stays in memory and is re-posted; we never store it on the client between
// requests.
function chainNextChunk(
  currentUrl: string,
  args: { password: string; force: boolean; offset: number },
): void {
  fetch(currentUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(args),
    cache: 'no-store',
  }).catch((err) => {
    console.error('[admin/refresh] chain failed', err);
  });
}
