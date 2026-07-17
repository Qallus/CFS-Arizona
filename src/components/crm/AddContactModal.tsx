'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { matterTypeLabel, MATTER_TYPES } from './crm-meta';
import { MultiCombobox } from '@/components/ui/combobox';

const MATTER_OPTIONS = MATTER_TYPES.map((m) => ({ value: m, label: matterTypeLabel[m] }));

export function AddContactModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobilePhone: '',
    referralSource: '',
  });
  const [matterTypes, setMatterTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.firstName.trim() && !form.lastName.trim()) {
      setError('Enter a first or last name.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/crm/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: { ...form, matterType: matterTypes.join(',') } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create the contact.');
      setForm({ firstName: '', lastName: '', email: '', mobilePhone: '', referralSource: '' });
      setMatterTypes([]);
      onOpenChange(false);
      onCreated();
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
            <DialogTitle className="text-foreground">New contact</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Creates the person record and starts them in the funnel at Awareness.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={form.firstName} onChange={set('firstName')} autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={set('email')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mobilePhone">Mobile phone</Label>
                <Input id="mobilePhone" value={form.mobilePhone} onChange={set('mobilePhone')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Matter type <span className="font-normal text-muted-foreground">(any that apply)</span></Label>
              <MultiCombobox
                options={MATTER_OPTIONS}
                value={matterTypes}
                onChange={setMatterTypes}
                placeholder="Select matter types…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="referralSource">Referral source</Label>
              <Input id="referralSource" value={form.referralSource} onChange={set('referralSource')} placeholder="Attorney, hospital, website…" />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Adding…' : 'Add contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
