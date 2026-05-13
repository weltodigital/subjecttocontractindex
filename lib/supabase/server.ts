import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

/**
 * Public (anon) client — safe for read-only queries against tables with RLS.
 * The index data is intentionally public so this is what most pages use.
 */
export function supabaseAnon() {
  return createClient<Database>(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      auth: { persistSession: false },
    },
  );
}

/**
 * Service-role client. Use ONLY in server-only paths (cron, admin, auth).
 * Bypasses RLS, so never import from a `'use client'` boundary.
 */
export function supabaseService() {
  return createClient<Database>(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: { persistSession: false },
    },
  );
}
