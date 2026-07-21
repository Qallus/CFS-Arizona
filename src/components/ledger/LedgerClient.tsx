'use client';

/**
 * Bill Pay & Ledger — client trust money in and out.
 *
 * Amounts are integer cents everywhere except the two conversion points below
 * (dollarsToCents on input, formatCents on display). Nothing in between ever
 * holds a fractional dollar, because this ledger becomes a court accounting.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Wallet, Plus, Search, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { PageShell, PageHeader, StatTile, StatusPill, type Tone } from '@/components/dashboard/page-parts';
import { DataViews, ViewSwitcher, type ViewMode, type ViewConfig } from '@/components/views/DataViews';
import { ItemActions } from '@/components/views/ItemActions';
import { formatDateOnly } from '@/lib/dates';
import { cn } from '@/lib/utils';

const ENTRY_TYPES = ['deposit', 'disbursement', 'fee', 'transfer', 'adjustment'] as const;
const TYPE_LABELS: Record<string, string> = {
  deposit: 'Deposit',
  disbursement: 'Disbursement',
  fee: 'Fiduciary fee',
  transfer: 'Transfer',
  adjustment: 'Adjustment',
};

const STATUSES = ['scheduled', 'pending', 'cleared', 'void'] as const;
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  pending: 'Pending',
  cleared: 'Cleared',
  void: 'Void',
};
const STATUS_TONES: Record<string, Tone> = {
  scheduled: 'info',
  pending: 'warning',
  cleared: 'good',
  void: 'neutral',
};

const METHODS = ['check', 'ach', 'card', 'cash', 'wire', 'transfer'] as const;

interface Entry {
  id: string;
  clientId: string | null;
  clientName: string | null;
  entryType: string;
  status: string;
  amountCents: number;
  description: string;
  category: string | null;
  payeeName: string | null;
  payeeAddress: string | null;
  payeeCity: string | null;
  payeeState: string | null;
  method: string | null;
  reference: string | null;
  accountLabel: string | null;
  entryDate: string | null;
  dueDate: string | null;
  notes: string | null;
  archivedAt: string | null;
  isFavorite?: boolean;
}

interface Totals {
  inCents: number;
  outCents: number;
  balanceCents: number;
  pendingOutCents: number;
}

const EMPTY_FORM = {
  entryType: 'disbursement',
  status: 'scheduled',
  amount: '',
  description: '',
  category: '',
  payeeName: '',
  payeeAddress: '',
  payeeCity: '',
  payeeState: '',
  method: 'check',
  reference: '',
  accountLabel: '',
  entryDate: '',
  dueDate: '',
  notes: '',
};

/** Cents → "$1,234.56". Mirrors formatCents in lib/ledger. */
function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/**
 * "1,234.56" → 123456 cents.
 *
 * Rounds the scaled value rather than truncating. In binary floating point
 * 4.35 * 100 is 434.99999999999994, which truncates to 434 — a cent lost, and
 * a ledger that no longer reconciles. Verified: 1.10 and 4.35 both drift this
 * way, while 12.29 and 8.15 happen not to.
 */
function dollarsToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, '');
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

export function LedgerClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [totals, setTotals] = useState<Totals>({
    inCents: 0,
    outCents: 0,
    balanceCents: 0,
    pendingOutCents: 0,
  });
  const [provisioned, setProvisioned] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [mode, setMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const [editing, setEditing] = useState<Entry | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cfs_ledger_view') as ViewMode | null;
    if (saved) setMode(saved);
  }, []);
  const changeMode = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem('cfs_ledger_view', m);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set('search', search.trim());
      if (typeFilter) qs.set('entryType', typeFilter);
      if (statusFilter) qs.set('status', statusFilter);
      if (showArchived) qs.set('includeArchived', 'true');
      const res = await fetch(`/api/ledger?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load the ledger.');
      if (data.provisioned === false) {
        setProvisioned(false);
        setEntries([]);
        return;
      }
      setProvisioned(true);
      setEntries(Array.isArray(data.entries) ? data.entries : []);
      if (data.totals) setTotals(data.totals);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, showArchived]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  async function save() {
    const cents = dollarsToCents(form.amount);
    if (cents === null) {
      setError('Enter an amount.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        entryType: form.entryType,
        status: form.status,
        amountCents: Math.abs(cents),
        description: form.description,
        category: form.category,
        payeeName: form.payeeName,
        payeeAddress: form.payeeAddress,
        payeeCity: form.payeeCity,
        payeeState: form.payeeState,
        method: form.method,
        reference: form.reference,
        accountLabel: form.accountLabel,
        entryDate: form.entryDate || null,
        dueDate: form.dueDate || null,
        notes: form.notes,
      };
      const res = editing
        ? await fetch(`/api/ledger/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/ledger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the entry.');
      setEditing(null);
      setCreating(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function patch(entry: Entry, body: Record<string, unknown>) {
    setBusyId(entry.id);
    try {
      const res = await fetch(`/api/ledger/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleFavorite(entry: Entry, next: boolean) {
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, isFavorite: next } : e)));
    try {
      const res = await fetch('/api/collections/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'ledger_entry', entityId: entry.id, favorite: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not update the favorite.');
    } catch (err) {
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, isFavorite: !next } : e)));
      setError((err as Error).message);
    }
  }

  async function remove(entry: Entry) {
    setBusyId(entry.id);
    try {
      const res = await fetch(`/api/ledger/${entry.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete the entry.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  function openEdit(entry: Entry) {
    setEditing(entry);
    setForm({
      entryType: entry.entryType,
      status: entry.status,
      amount: (Math.abs(entry.amountCents) / 100).toFixed(2),
      description: entry.description ?? '',
      category: entry.category ?? '',
      payeeName: entry.payeeName ?? '',
      payeeAddress: entry.payeeAddress ?? '',
      payeeCity: entry.payeeCity ?? '',
      payeeState: entry.payeeState ?? '',
      method: entry.method ?? 'check',
      reference: entry.reference ?? '',
      accountLabel: entry.accountLabel ?? '',
      entryDate: entry.entryDate ?? '',
      dueDate: entry.dueDate ?? '',
      notes: entry.notes ?? '',
    });
  }

  const config: ViewConfig<Entry> = useMemo(
    () => ({
      getId: (e) => e.id,
      getTitle: (e) => e.description,
      getSubtitle: (e) =>
        [TYPE_LABELS[e.entryType] ?? e.entryType, e.payeeName, e.clientName]
          .filter(Boolean)
          .join(' · '),
      getMeta: (e) => `${e.amountCents < 0 ? '−' : '+'}${formatCents(Math.abs(e.amountCents))}`,
      getBadge: (e) => ({
        label: STATUS_LABELS[e.status] ?? e.status,
        tone: STATUS_TONES[e.status] ?? 'neutral',
      }),
      // Grouped by status: a bill-pay board is a workflow — scheduled, pending,
      // cleared — and dragging between them is how the work actually moves.
      columns: STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s], tone: STATUS_TONES[s] })),
      getColumnKey: (e) => e.status,
      getDate: (e) => e.dueDate ?? e.entryDate,
      getAddress: (e) =>
        e.payeeCity?.trim() || e.payeeAddress?.trim()
          ? [e.payeeAddress, e.payeeCity, e.payeeState].filter(Boolean).join(', ')
          : null,
      isFavorite: (e) => Boolean(e.isFavorite),
      isArchived: (e) => Boolean(e.archivedAt),
      fields: [
        { key: 'type', label: 'Type', render: (e) => TYPE_LABELS[e.entryType] ?? e.entryType },
        { key: 'client', label: 'Client', render: (e) => e.clientName || '—' },
        { key: 'payee', label: 'Payee', render: (e) => e.payeeName || '—' },
        {
          key: 'amount',
          label: 'Amount',
          className: 'text-right',
          render: (e) => (
            <span
              className={cn(
                'tabular-nums font-medium',
                e.amountCents < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400',
              )}
            >
              {e.amountCents < 0 ? '−' : '+'}
              {formatCents(Math.abs(e.amountCents))}
            </span>
          ),
        },
        { key: 'due', label: 'Due', render: (e) => formatDateOnly(e.dueDate) },
        {
          key: 'status',
          label: 'Status',
          render: (e) => (
            <StatusPill tone={STATUS_TONES[e.status] ?? 'neutral'}>
              {STATUS_LABELS[e.status] ?? e.status}
            </StatusPill>
          ),
        },
      ],
    }),
    [],
  );

  return (
    <PageShell>
      <PageHeader
        eyebrow="Money"
        title="Bill Pay & Ledger"
        description="Client trust money in and out — the record a court accounting is built from."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setForm(EMPTY_FORM);
              setCreating(true);
            }}
          >
            <Plus className="size-4" /> Record entry
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Cleared balance" value={formatCents(totals.balanceCents)} icon={Wallet} tone="brand" />
        <StatTile label="Money in" value={formatCents(totals.inCents)} icon={ArrowDownLeft} tone="good" />
        <StatTile label="Money out" value={formatCents(totals.outCents)} icon={ArrowUpRight} />
        <StatTile label="Not yet cleared" value={formatCents(totals.pendingOutCents)} icon={Clock} tone="warning" />
      </div>

      {!provisioned ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium text-foreground">Database not provisioned yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Apply <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">20260721000004_documents_ledger.sql</code>{' '}
            in the Supabase SQL editor.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search descriptions, payees, check numbers…"
                className="pl-8"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-secondary px-2.5 text-sm text-foreground"
            >
              <option value="">All types</option>
              {ENTRY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-secondary px-2.5 text-sm text-foreground"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="size-4 accent-current"
              />
              Archived
            </label>

            <ViewSwitcher mode={mode} onChange={changeMode} />
          </div>

          {error && (
            <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          {loading ? (
            <p className="py-14 text-center text-sm text-muted-foreground">Loading ledger…</p>
          ) : (
            <DataViews
              mode={mode}
              items={entries}
              config={config}
              onOpen={openEdit}
              onColumnChange={(e, status) => patch(e, { status })}
              emptyTitle="No ledger entries yet"
              emptyDescription="Record the first deposit or disbursement."
              renderActions={(e) => (
                <ItemActions
                  label={e.description}
                  busy={busyId === e.id}
                  isFavorite={Boolean(e.isFavorite)}
                  isArchived={Boolean(e.archivedAt)}
                  onEdit={() => openEdit(e)}
                  onFavorite={(next) => toggleFavorite(e, next)}
                  onArchive={(next) => patch(e, { archived: next })}
                  onDelete={() => remove(e)}
                />
              )}
            />
          )}
        </>
      )}

      {/* Create / edit */}
      <Dialog
        open={creating || Boolean(editing)}
        onOpenChange={(v) => {
          if (!v) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit entry' : 'Record a ledger entry'}</DialogTitle>
            <DialogDescription>
              Enter the amount as a positive number — deposits add to the balance, disbursements and
              fees subtract from it.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
                  value={form.entryType}
                  onChange={(e) => setForm((f) => ({ ...f, entryType: e.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
                >
                  {ENTRY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="1,250.00"
                  inputMode="decimal"
                  className="tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Desert Vista — August care"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Payee</Label>
                <Input
                  value={form.payeeName}
                  onChange={(e) => setForm((f) => ({ ...f, payeeName: e.target.value }))}
                  placeholder="Desert Vista Care"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Care, utilities, medical…"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Payee address</Label>
                <Input
                  value={form.payeeAddress}
                  onChange={(e) => setForm((f) => ({ ...f, payeeAddress: e.target.value }))}
                  placeholder="1234 E Camelback Rd"
                />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input
                  value={form.payeeCity}
                  onChange={(e) => setForm((f) => ({ ...f, payeeCity: e.target.value }))}
                  placeholder="Phoenix"
                />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input
                  value={form.payeeState}
                  onChange={(e) => setForm((f) => ({ ...f, payeeState: e.target.value }))}
                  placeholder="AZ"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Method</Label>
                <select
                  value={form.method}
                  onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Reference</Label>
                <Input
                  value={form.reference}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                  placeholder="Check #1042"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Account</Label>
                <Input
                  value={form.accountLabel}
                  onChange={(e) => setForm((f) => ({ ...f, accountLabel: e.target.value }))}
                  placeholder="Trust — Prescott"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Entry date</Label>
                <DatePicker
                  value={form.entryDate}
                  onChange={(v) => setForm((f) => ({ ...f, entryDate: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <DatePicker
                  value={form.dueDate}
                  onChange={(v) => setForm((f) => ({ ...f, dueDate: v }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none"
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !form.description.trim() || !form.amount.trim()}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Record entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
