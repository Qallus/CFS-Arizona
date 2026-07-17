/**
 * Internal direct messages (sig_messages). Server-only.
 */
import { supabaseAdmin } from '@/lib/supabase';
import { raisePg, type PgError } from './access';

type Row = Record<string, unknown>;
const COLS = 'id, sender_name, recipient, subject, body, read_at, created_at';

export interface MessageRow {
  id: string;
  senderName: string | null;
  recipient: string | null;
  subject: string | null;
  body: string;
  readAt: string | null;
  createdAt: string;
}

function mapRow(r: Row): MessageRow {
  return {
    id: String(r.id),
    senderName: (r.sender_name as string) ?? null,
    recipient: (r.recipient as string) ?? null,
    subject: (r.subject as string) ?? null,
    body: String(r.body ?? ''),
    readAt: (r.read_at as string) ?? null,
    createdAt: String(r.created_at ?? ''),
  };
}

export async function listMessages(limit = 100): Promise<MessageRow[]> {
  const { data, error } = await supabaseAdmin
    .from('sig_messages')
    .select(COLS)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) raisePg(error as PgError);
  return ((data ?? []) as Row[]).map(mapRow);
}

export interface SendMessageInput {
  senderName?: string | null;
  recipient?: string | null;
  subject?: string | null;
  body: string;
}

export async function sendMessage(input: SendMessageInput): Promise<MessageRow> {
  const insert = {
    sender_name: input.senderName ?? null,
    recipient: input.recipient?.trim() || 'Team',
    subject: input.subject?.trim() || null,
    body: input.body.trim(),
  };
  const { data, error } = await supabaseAdmin.from('sig_messages').insert(insert).select(COLS).single();
  if (error) raisePg(error as PgError);
  return mapRow(data as Row);
}

export async function markMessageRead(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('sig_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null);
  if (error) raisePg(error as PgError);
}
