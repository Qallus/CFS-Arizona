/**
 * Cookie-bound Supabase clients for the App Router (via @supabase/ssr).
 *
 * - `createSupabaseServerClient()` — for Route Handlers / Server Components /
 *   server actions. Reads & writes the auth session cookies through
 *   next/headers `cookies()`.
 *
 * The middleware variant lives in '@/lib/supabase-middleware' (no next/headers
 * import, so it is safe in the edge middleware bundle).
 *
 * These handle the *user* session (anon key + user JWT). For privileged
 * service-role writes keep using `supabaseAdmin` from '@/lib/supabase'.
 *
 * server-only.
 */
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  return { url, key };
}

/** Whether Supabase Auth is usable (env present). */
export function isSupabaseAuthConfigured(): boolean {
  const { url, key } = env();
  return Boolean(url && key);
}

/** Server client bound to the request's cookie jar (next/headers). */
export async function createSupabaseServerClient() {
  const { url, key } = env();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll called from a Server Component (read-only cookies) —
          // safe to ignore; middleware refreshes the session cookies.
        }
      },
    },
  });
}
