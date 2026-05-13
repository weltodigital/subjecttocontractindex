/**
 * iron-session config + helpers for the magic-link cookie.
 * Cookie is 30 days, signed with SESSION_SECRET (32+ char random string).
 */

import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export type IndexSession = {
  email?: string;
  verifiedAt?: string;
};

export function getSessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters');
  }
  return {
    password,
    cookieName: 'stc_index_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    },
  };
}

export async function getSession() {
  return getIronSession<IndexSession>(cookies(), getSessionOptions());
}
