import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured');
}

/**
 * Whether the service-role key is present. Without it `supabaseAdmin` degrades
 * to the anon client, and every RLS-protected read (sig_profiles, sig_*) comes
 * back as an EMPTY result with no error — which reads as "user has no profile"
 * and 401s the whole app. Callers use this to report the real cause.
 */
export const hasServiceRoleKey = Boolean(supabaseServiceKey);

if (!hasServiceRoleKey) {
  console.warn(
    'SUPABASE_SERVICE_ROLE_KEY is not set — falling back to the anon key. ' +
      'RLS-protected tables will read as empty and API routes will return 401.',
  );
}

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role (for admin operations)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

// Alternative function-based server client creator
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
};

// Types
export interface Voicemail {
  id: string;
  call_sid?: string;
  from?: string;
  from_number: string;
  to?: string;
  recording_url?: string;
  transcription?: string;
  duration: number;
  status?: 'new' | 'read' | 'archived';
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}
