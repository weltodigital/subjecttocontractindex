import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(new URL('/', request.url));
}
