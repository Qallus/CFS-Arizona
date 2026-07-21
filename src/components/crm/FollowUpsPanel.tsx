'use client';

/**
 * Follow-ups for one contact: what happens next, when, and who owes it.
 *
 * Sits beside the activity timeline, which records what already happened.
 * Together they are the communication trail — history behind, plan ahead.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Phone,
  Mail,
  MessageSquare,
  Users,
  Video,
  Send,
  CheckSquare,
  Plus,
  Check,
  Trash2,
  BellRing,
  AlarmClock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionCard, StatusPill, EmptyState, type Tone } from '@/components/dashboard/page-parts';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';

const METHODS = [
  { key: 'phone', label: 'Phone call', icon: Phone },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'sms', label: 'Text message', icon: MessageSquare },
  { key: 'meeting_in_person', label: 'Meeting — in person', icon: Users },
  { key: 'meeting_video', label: 'Meeting — video', icon: Video },
  { key: 'mail', label: 'Physical mail', icon: Send },
  { key: 'task', label: 'Task', icon: CheckSquare },
] as const;

const METHOD_MAP = Object.fromEntries(METHODS.map((m) => [m.key, m]));

const REMIND_CHANNELS = [
  { key: 'none', label: 'No reminder' },
  { key: 'email', label: 'Email me' },
  { key: 'sms', label: 'Text me' },
  { key: 'both', label: 'Email + text' },
];

const FREQUENCIES = [
  { key: 'once', label: 'Once' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'biweekly', label: 'Every 2 weeks' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
];

const LEAD_TIMES = [
  { minutes: 0, label: 'At the due time' },
  { minutes: 60, label: '1 hour before' },
  { minutes: 60 * 24, label: '1 day before' },
  { minutes: 60 * 24 * 3, label: '3 days before' },
  { minutes: 60 * 24 * 7, label: '1 week before' },
];

interface FollowUp {
  id: string;
  dueAt: string;
  contactMethod: string;
  subject: string | null;
  notes: string | null;
  remindChannel: string;
  remindBeforeMinutes: number;
  frequency: string;
  status: string;
  completedAt: string | null;
}

const EMPTY = {
  dueDate: '',
  dueTime: '09:00',
  contactMethod: 'phone',
  subject: '',
  notes: '',
  remindChannel: 'email',
  remindBeforeMinutes: 60 * 24,
  frequency: 'once',
};

/** Local date + time → an ISO instant, without a UTC round-trip on the date. */
function toIsoInstant(date: string, time: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const [hh, mi] = (time || '09:00').split(':').map(Number);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), hh || 0, mi || 0).toISOString();
}

function dueLabel(iso: string): { text: string; tone: Tone } {
  const due = new Date(iso).getTime();
  const days = Math.round((due - Date.now()) / 86_400_000);
  if (days < 0) return { text: `Overdue by ${-days}d`, tone: 'critical' };
  if (days === 0) return { text: 'Due today', tone: 'warning' };
  if (days === 1) return { text: 'Due tomorrow', tone: 'warning' };
  return { text: `Due in ${days}d`, tone: 'info' };
}

export function FollowUpsPanel({ contactId }: { contactId: string }) {
  const [items, setItems] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/followups?contactId=${contactId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load follow-ups.');
      setItems(Array.isArray(data.followUps) ? data.followUps : []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    const dueAt = toIsoInstant(form.dueDate, form.dueTime);
    if (!dueAt) {
      setError('Pick a date for the next contact.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          dueAt,
          contactMethod: form.contactMethod,
          subject: form.subject,
          notes: form.notes,
          remindChannel: form.remindChannel,
          remindBeforeMinutes: form.remindBeforeMinutes,
          frequency: form.frequency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not schedule the follow-up.');
      setForm(EMPTY);
      setAdding(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function complete(id: string) {
    try {
      const res = await fetch(`/api/followups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complete: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not complete it.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/followups/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not delete it.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const open = items.filter((i) => i.status === 'open');
  const done = items.filter((i) => i.status !== 'open');
  const visible = showDone ? done : open;

  return (
    <SectionCard
      title="Next steps"
      description="What happens next with this contact, and who owes it."
      action={
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setShowDone((v) => !v)}>
            {showDone ? `Open (${open.length})` : `Completed (${done.length})`}
          </Button>
          <Button size="sm" onClick={() => setAdding((v) => !v)}>
            <Plus className="size-4" /> Schedule
          </Button>
        </div>
      }
    >
      {error && (
        <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {adding && (
        <div className="mb-4 space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Next contact date</Label>
              <DatePicker
                value={form.dueDate}
                onChange={(v) => setForm((f) => ({ ...f, dueDate: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input
                type="time"
                value={form.dueTime}
                onChange={(e) => setForm((f) => ({ ...f, dueTime: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>How</Label>
              <select
                value={form.contactMethod}
                onChange={(e) => setForm((f) => ({ ...f, contactMethod: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              >
                {METHODS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>What for</Label>
            <Input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Check whether they signed the CIF"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Remind me</Label>
              <select
                value={form.remindChannel}
                onChange={(e) => setForm((f) => ({ ...f, remindChannel: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              >
                {REMIND_CHANNELS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>When</Label>
              <select
                value={form.remindBeforeMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, remindBeforeMinutes: Number(e.target.value) }))
                }
                disabled={form.remindChannel === 'none'}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground disabled:opacity-50"
              >
                {LEAD_TIMES.map((l) => (
                  <option key={l.minutes} value={l.minutes}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Repeat</Label>
              <select
                value={form.frequency}
                onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={saving || !form.dueDate}>
              {saving ? 'Scheduling…' : 'Schedule'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={AlarmClock}
          title={showDone ? 'Nothing completed yet' : 'No next step scheduled'}
          description={
            showDone
              ? 'Completed follow-ups will collect here.'
              : 'Schedule the next call, email or meeting so this contact does not go quiet.'
          }
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {visible.map((f) => {
            const method = METHOD_MAP[f.contactMethod] ?? METHOD_MAP.task;
            const Icon = method.icon;
            const due = dueLabel(f.dueAt);
            return (
              <li key={f.id} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={cn('font-medium text-foreground', f.status !== 'open' && 'line-through opacity-60')}>
                      {f.subject || method.label}
                    </span>
                    {f.status === 'open' && <StatusPill tone={due.tone}>{due.text}</StatusPill>}
                    {f.frequency !== 'once' && (
                      <StatusPill tone="neutral">
                        {FREQUENCIES.find((x) => x.key === f.frequency)?.label}
                      </StatusPill>
                    )}
                    {f.remindChannel !== 'none' && f.status === 'open' && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <BellRing className="size-3" />
                        {REMIND_CHANNELS.find((c) => c.key === f.remindChannel)?.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {method.label} ·{' '}
                    {new Date(f.dueAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                  {f.notes && <p className="mt-0.5 text-sm text-muted-foreground">{f.notes}</p>}
                </div>

                {f.status === 'open' && (
                  <button
                    onClick={() => complete(f.id)}
                    title="Mark done"
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-emerald-600"
                  >
                    <Check className="size-4" />
                  </button>
                )}
                <button
                  onClick={() => remove(f.id)}
                  title="Delete"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
