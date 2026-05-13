import { NextResponse } from 'next/server';
import { runRefresh } from '@/lib/refresh';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expected = process.env.CRON_SECRET;

  // Vercel cron sends `Authorization: Bearer <CRON_SECRET>` automatically when
  // the env var is set. In dev or for manual hits without the header, refuse.
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runRefresh();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/refresh-index] fatal', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
