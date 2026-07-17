'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Car, Plus, DollarSign, Clock, Route, Database, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/dialog';
import {
  PageShell,
  PageHeader,
  StatTile,
  SectionCard,
  StatusPill,
  TableWrap,
  Th,
  Td,
  Tr,
  EmptyState,
} from '@/components/dashboard/page-parts';

interface Entry {
  id: string;
  profileId: string;
  employeeName: string | null;
  tripDate: string;
  purpose: string | null;
  fromLocation: string | null;
  toLocation: string | null;
  miles: number;
  ratePerMile: number;
  amount: number;
  contactName: string | null;
  notes: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'reimbursed';
}

const statusTone: Record<Entry['status'], 'neutral' | 'warning' | 'brand' | 'good'> = {
  draft: 'neutral',
  submitted: 'warning',
  approved: 'brand',
  reimbursed: 'good',
};

const money = (n: number) => `$${n.toFixed(2)}`;
const fmtDate = (iso: string) => {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
};

export function MileageClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [provisioned, setProvisioned] = useState(true);
  const [canViewAll, setCanViewAll] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/mileage');
      const data = await res.json();
      setProvisioned(data.provisioned !== false);
      setEntries(Array.isArray(data.entries) ? data.entries : []);
      setCanViewAll(Boolean(data.canViewAll));
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = entries.filter((e) => {
      const d = new Date(e.tripDate + 'T00:00:00');
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    return {
      milesMonth: thisMonth.reduce((n, e) => n + e.miles, 0),
      amountMonth: thisMonth.reduce((n, e) => n + e.amount, 0),
      pending: entries.filter((e) => e.status === 'submitted').length,
      trips: entries.length,
    };
  }, [entries]);

  async function setStatus(id: string, status: Entry['status']) {
    setBusy(true);
    try {
      await fetch(`/api/hr/mileage/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!loading && !provisioned) {
    return (
      <PageShell>
        <PageHeader eyebrow="Team" title="Mileage Log" description="Employee mileage expense tracking." />
        <EmptyState icon={Database} title="Database not provisioned yet" description="Apply the HR migrations to your Supabase to enable the mileage log." />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Team"
        title="Mileage Log"
        description={canViewAll ? 'Mileage expenses across the team — approve and mark reimbursed.' : 'Log the miles you drive for CFS business.'}
        actions={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="size-4" /> Log trip
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Miles this month" value={stats.milesMonth.toFixed(1)} icon={Route} tone="brand" />
        <StatTile label="Reimbursement (mo)" value={money(stats.amountMonth)} icon={DollarSign} tone="good" />
        <StatTile label="Awaiting approval" value={stats.pending} icon={Clock} tone="warning" />
        <StatTile label="Total trips" value={stats.trips} icon={Car} />
      </div>

      <SectionCard title="Trips" bodyClassName="p-0">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Car} title="No trips logged" description="Log your first trip to start tracking mileage." />
          </div>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Date</Th>
                {canViewAll && <Th>Employee</Th>}
                <Th>Purpose</Th>
                <Th>Route</Th>
                <Th className="text-right">Miles</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-right">Status</Th>
                {canViewAll && <Th></Th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <Tr key={e.id}>
                  <Td className="whitespace-nowrap text-muted-foreground">{fmtDate(e.tripDate)}</Td>
                  {canViewAll && <Td className="font-medium text-foreground">{e.employeeName ?? '—'}</Td>}
                  <Td>
                    <span className="text-foreground">{e.purpose || '—'}</span>
                    {e.contactName && <span className="ml-2 text-xs text-muted-foreground">· {e.contactName}</span>}
                  </Td>
                  <Td className="text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5 opacity-70" />
                      {e.fromLocation || '—'} → {e.toLocation || '—'}
                    </span>
                  </Td>
                  <Td className="text-right tabular-nums text-foreground">{e.miles.toFixed(1)}</Td>
                  <Td className="text-right font-medium tabular-nums text-foreground">{money(e.amount)}</Td>
                  <Td className="text-right">
                    <StatusPill tone={statusTone[e.status]}>{e.status}</StatusPill>
                  </Td>
                  {canViewAll && (
                    <Td className="text-right">
                      {e.status === 'submitted' && (
                        <Button size="xs" variant="outline" disabled={busy} onClick={() => setStatus(e.id, 'approved')}>
                          Approve
                        </Button>
                      )}
                      {e.status === 'approved' && (
                        <Button size="xs" variant="outline" disabled={busy} onClick={() => setStatus(e.id, 'reimbursed')}>
                          Mark paid
                        </Button>
                      )}
                    </Td>
                  )}
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </SectionCard>

      <p className="mt-3 text-xs text-muted-foreground">
        Reimbursement is calculated from the mileage rate on each trip (default $0.70/mile).
      </p>

      <AddTripModal open={showAdd} onOpenChange={setShowAdd} onSaved={load} />
    </PageShell>
  );
}

function AddTripModal({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [tripDate, setTripDate] = useState(today);
  const [purpose, setPurpose] = useState('');
  const [fromLocation, setFrom] = useState('');
  const [toLocation, setTo] = useState('');
  const [miles, setMiles] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!(Number(miles) > 0)) {
      setError('Enter the miles driven.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/hr/mileage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripDate, purpose, fromLocation, toLocation, miles: Number(miles), notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the trip.');
      setPurpose(''); setFrom(''); setTo(''); setMiles(''); setNotes(''); setTripDate(today);
      onOpenChange(false);
      onSaved();
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
            <DialogTitle className="text-foreground">Log a trip</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Mileage is reimbursed at the current CFS rate.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <DatePicker value={tripDate} onChange={setTripDate} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="miles">Miles</Label>
                <Input id="miles" type="number" step="0.1" min="0" value={miles} onChange={(e) => setMiles(e.target.value)} placeholder="0.0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purpose">Purpose</Label>
              <Input id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Client visit, court filing…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="from">From</Label>
                <Input id="from" value={fromLocation} onChange={(e) => setFrom(e.target.value)} placeholder="Office (Peoria)" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to">To</Label>
                <Input id="to" value={toLocation} onChange={(e) => setTo(e.target.value)} placeholder="Destination" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Log trip'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
