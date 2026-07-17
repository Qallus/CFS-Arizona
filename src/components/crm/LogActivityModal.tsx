'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'Text (SMS)' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'mail', label: 'Mailed item' },
  { value: 'note', label: 'Note' },
];

export function LogActivityModal({
  open,
  onOpenChange,
  contactId,
  opportunityId,
  onLogged,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contactId: string;
  opportunityId?: string | null;
  onLogged: () => void;
}) {
  const [type, setType] = useState('call');
  const [direction, setDirection] = useState('out');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [minutes, setMinutes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          opportunityId: opportunityId ?? null,
          type,
          direction: type === 'note' || type === 'reminder' ? null : direction,
          subject,
          body,
          billableMinutes: Number(minutes) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not log the activity.');
      setSubject('');
      setBody('');
      setMinutes('');
      onOpenChange(false);
      onLogged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Log activity</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Captured on the contact timeline and counted as billable time.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="direction">Direction</Label>
                <select
                  id="direction"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  disabled={type === 'note' || type === 'reminder'}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
                >
                  <option value="out">Outbound</option>
                  <option value="in">Inbound</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Notes</Label>
              <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="What happened / what's next" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="minutes">Billable minutes</Label>
              <Input id="minutes" type="number" min={0} value={minutes} onChange={(e) => setMinutes(e.target.value)} className="w-32" placeholder="0" />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Log activity'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
