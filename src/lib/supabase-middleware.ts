/**
 * Supabase client for Next.js middleware (edge-safe: no next/headers).
 * Reads cookies from the NextRequest and writes refreshed session cookies
 * onto the NextResponse.
 */
import type { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  return { url, key };
}

export function supabaseAuthEnvPresent(): boolean {
  const { url, key } = env();
  return Boolean(url && key);
}

export function createSupabaseMiddlewareClient(req: NextRequest, res: NextResponse) {
  const { url, key } = env();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          res.cookies.set(name, value, options);
        }
      },
    },
  });
}
