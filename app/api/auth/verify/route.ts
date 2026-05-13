import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';
import { getSubscriberStatus } from '@/lib/beehiiv';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return redirectToError(url, 'missing_token');
  }

  const db = supabaseService();
  const { data: row, error } = await db
    .from('auth_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error || !row) {
    return redirectToError(url, 'invalid');
  }
  if (row.used) {
    return redirectToError(url, 'used');
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return redirectToError(url, 'expired');
  }

  // Re-verify subscriber status in case they've unsubscribed since requesting.
  const status = await getSubscriberStatus(row.email, { forceRefresh: true });
  if (status.kind !== 'has_access') {
    return redirectToError(url, 'no_access');
  }

  await db
    .from('auth_tokens')
    .update({ used: true, used_at: new Date().toISOString() })
    .eq('token', token);

  const session = await getSession();
  session.email = row.email;
  session.verifiedAt = new Date().toISOString();
  await session.save();

  const destination = url.searchParams.get('next') ?? '/towns/brighton';
  return NextResponse.redirect(new URL(destination, url));
}

function redirectToError(url: URL, reason: string): NextResponse {
  const target = new URL('/auth/error', url);
  target.searchParams.set('reason', reason);
  return NextResponse.redirect(target);
}
