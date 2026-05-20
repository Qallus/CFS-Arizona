import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured');
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
