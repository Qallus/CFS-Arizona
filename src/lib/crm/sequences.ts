/**
 * Follow-up sequences (configurable cadence) — read access.
 * Structure only: intervals/channel/copy are configurable placeholders that
 * CFS finalizes later (they are NOT hard-coded).
 *
 * server-only.
 */
import { supabaseAdmin } from '@/lib/supabase';
import { raisePg, type PgError } from './access';

type Row = Record<string, unknown>;

export interface SequenceStep {
  id: string;
  stepOrder: number;
  offsetDays: number;
  channel: string;
  message: string | null;
}

export interface FollowUpSequence {
  id: string;
  name: string;
  stallStage: string;
  active: boolean;
  steps: SequenceStep[];
}

export async function listSequences(): Promise<FollowUpSequence[]> {
  const { data, error } = await supabaseAdmin
    .from('sig_follow_up_sequences')
    .select('id, name, stall_stage, active, steps:sig_sequence_steps ( id, step_order, offset_days, channel, message )')
    .order('name', { ascending: true });
  if (error) raisePg(error as PgError);
  return ((data ?? []) as Row[]).map((r) => ({
    id: String(r.id),
    name: String(r.name),
    stallStage: String(r.stall_stage),
    active: Boolean(r.active),
    steps: (((r.steps as Row[]) ?? [])
      .map((s) => ({
        id: String(s.id),
        stepOrder: Number(s.step_order),
        offsetDays: Number(s.offset_days),
        channel: String(s.channel),
        message: (s.message as string) ?? null,
      }))
      .sort((a, b) => a.stepOrder - b.stepOrder)),
  }));
}
