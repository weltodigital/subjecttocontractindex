import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseService } from '@/lib/supabase/server';
import { getSubscriberStatus } from '@/lib/beehiiv';
import { sendMagicLink } from '@/lib/email';

export const dynamic = 'force-dynamic';
const TOKEN_TTL_MINUTES = 15;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  try {
    const status = await getSubscriberStatus(email);

    if (status.kind === 'not_subscribed') {
      return NextResponse.json({ status: 'not_subscribed' });
    }

    if (status.kind === 'no_referrals') {
      return NextResponse.json({
        status: 'no_referrals',
        referral_count: status.referralCount,
      });
    }

    const token = randomUUID();
    const expiresAt = new Date(
      Date.now() + TOKEN_TTL_MINUTES * 60 * 1000,
    ).toISOString();

    const db = supabaseService();
    const { error: insertError } = await db.from('auth_tokens').insert({
      token,
      email,
      expires_at: expiresAt,
    });
    if (insertError) throw new Error(`token insert failed: ${insertError.message}`);

    const base =
      process.env.NEXT_PUBLIC_BASE_URL ?? 'https://index.subjecttocontract.com';
    const url = `${base}/api/auth/verify?token=${encodeURIComponent(token)}`;

    await sendMagicLink({ to: email, url });

    return NextResponse.json({ status: 'email_sent' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[auth/request-access]', message);
    return NextResponse.json({ error: 'something_went_wrong' }, { status: 500 });
  }
}
