'use client';

/**
 * Referrals — the intake log, on the shared view layer.
 *
 * Fields follow the CFS referral sheet exactly, including the primary/
 * secondary pair: CFS serves couples, and a spouse is a party to the matter
 * rather than a note about it.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, Plus, Search, Scale, UserPlus, CheckCircle2 } from 'lucide-react';
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
import { MultiCombobox } from '@/components/ui/combobox';
import { PageShell, PageHeader, StatTile, StatusPill, type Tone } from '@/components/dashboard/page-parts';
import { DataViews, ViewSwitcher, type ViewMode, type ViewConfig } from '@/components/views/DataViews';
import { ItemActions } from '@/components/views/ItemActions';
import { formatDateOnly } from '@/lib/dates';
import { MATTER_TYPES, matterTypeLabel, parseMatterTypes, formatMatterTypes } from '@/components/crm/crm-meta';

const MATTER_OPTIONS = MATTER_TYPES.map((m) => ({ value: m, label: matterTypeLabel[m] }));

// Matches the 2025 intake sheet's own workflow rather than a generic
// new/contacted/lost pipeline, which fit none of the real 20 status phrasings.
const STATUSES = [
  'awaiting',
  'nominated',
  'pending_decision',
  'accepted',
  'declined',
  'referred_out',
  'converted',
] as const;
const STATUS_LABELS: Record<string, string> = {
  awaiting: 'Awaiting status',
  nominated: 'Nominated CFS',
  pending_decision: 'Pending decision',
  accepted: 'Accepted',
  declined: 'Declined',
  referred_out: 'Referred out',
  converted: 'Converted',
};
const STATUS_TONES: Record<string, Tone> = {
  awaiting: 'info',
  nominated: 'brand',
  pending_decision: 'warning',
  accepted: 'good',
  declined: 'neutral',
  referred_out: 'neutral',
  converted: 'good',
};

/** CFS's own engagement codes from the intake sheet. Free text either way. */
const REFERRAL_TYPES = ['PNFF', 'PNC', 'PNFF/PNC', 'FF', 'TBD'];

interface Referral {
  id: string;
  clientName: string;
  primaryFirstName: string | null;
  primaryLastName: string | null;
  secondaryFirstName: string | null;
  secondaryLastName: string | null;
  primaryEmail: string | null;
  secondaryEmail: string | null;
  primaryPhone: string | null;
  secondaryPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  matterType: string | null;
  referralDate: string | null;
  referredBy: string | null;
  referralType: string | null;
  attorney: string | null;
  appointmentNotes: string | null;
  status: string;
  statusDetail: string | null;
  notes: string | null;
  contactId: string | null;
  archivedAt: string | null;
  isFavorite?: boolean;
}

const EMPTY_FORM = {
  clientName: '',
  primaryFirstName: '',
  primaryLastName: '',
  secondaryFirstName: '',
  secondaryLastName: '',
  primaryEmail: '',
  secondaryEmail: '',
  primaryPhone: '',
  secondaryPhone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  matterType: '',
  referralDate: '',
  referredBy: '',
  referralType: '',
  attorney: '',
  appointmentNotes: '',
  status: 'awaiting',
  statusDetail: '',
  notes: '',
};

export function ReferralsClient() {
  const router = useRouter();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [provisioned, setProvisioned] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [mode, setMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const [editing, setEditing] = useState<Referral | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cfs_referrals_view') as ViewMode | null;
    if (saved) setMode(saved);
  }, []);
  const changeMode = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem('cfs_referrals_view', m);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set('search', search.trim());
      if (statusFilter) qs.set('status', statusFilter);
      if (showArchived) qs.set('includeArchived', 'true');
      const res = await fetch(`/api/referrals?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load referrals.');
      if (data.provisioned === false) {
        setProvisioned(false);
        setReferrals([]);
        return;
      }
      setProvisioned(true);
      setReferrals(Array.isArray(data.referrals) ? data.referrals : []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, showArchived]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, referralDate: form.referralDate || null };
      const res = editing
        ? await fetch(`/api/referrals/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/referrals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the referral.');
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

  async function patch(referral: Referral, body: Record<string, unknown>) {
    setBusyId(referral.id);
    try {
      const res = await fetch(`/api/referrals/${referral.id}`, {
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

  async function convert(referral: Referral) {
    setBusyId(referral.id);
    setNotice('');
    try {
      const res = await fetch(`/api/referrals/${referral.id}/convert`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not convert the referral.');
      setNotice(
        data.alreadyConverted
          ? `${referral.clientName} was already converted — opening the existing contact.`
          : `${referral.clientName} is now a contact.`,
      );
      await load();
      router.push(`/contacts/${data.contactId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleFavorite(referral: Referral, next: boolean) {
    setReferrals((prev) => prev.map((r) => (r.id === referral.id ? { ...r, isFavorite: next } : r)));
    try {
      const res = await fetch('/api/collections/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'referral', entityId: referral.id, favorite: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not update the favorite.');
    } catch (err) {
      setReferrals((prev) => prev.map((r) => (r.id === referral.id ? { ...r, isFavorite: !next } : r)));
      setError((err as Error).message);
    }
  }

  async function remove(referral: Referral) {
    setBusyId(referral.id);
    try {
      const res = await fetch(`/api/referrals/${referral.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete the referral.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  function openEdit(referral: Referral) {
    setEditing(referral);
    setForm({
      clientName: referral.clientName ?? '',
      primaryFirstName: referral.primaryFirstName ?? '',
      primaryLastName: referral.primaryLastName ?? '',
      secondaryFirstName: referral.secondaryFirstName ?? '',
      secondaryLastName: referral.secondaryLastName ?? '',
      primaryEmail: referral.primaryEmail ?? '',
      secondaryEmail: referral.secondaryEmail ?? '',
      primaryPhone: referral.primaryPhone ?? '',
      secondaryPhone: referral.secondaryPhone ?? '',
      addressLine1: referral.addressLine1 ?? '',
      addressLine2: referral.addressLine2 ?? '',
      city: referral.city ?? '',
      state: referral.state ?? '',
      postalCode: referral.postalCode ?? '',
      matterType: referral.matterType ?? '',
      referralDate: referral.referralDate ?? '',
      referredBy: referral.referredBy ?? '',
      referralType: referral.referralType ?? '',
      attorney: referral.attorney ?? '',
      appointmentNotes: referral.appointmentNotes ?? '',
      status: referral.status,
      statusDetail: referral.statusDetail ?? '',
      notes: referral.notes ?? '',
    });
  }

  const config: ViewConfig<Referral> = useMemo(
    () => ({
      getId: (r) => r.id,
      getTitle: (r) => r.clientName,
      getSubtitle: (r) =>
        [r.referralType, r.referredBy && `via ${r.referredBy}`, formatMatterTypes(r.matterType ?? '')]
          .filter(Boolean)
          .join(' · '),
      getMeta: (r) => (r.referralDate ? formatDateOnly(r.referralDate) : ''),
      getBadge: (r) => ({
        // CFS's own wording when there is one: "Refd to A. Lambson for acctg"
        // says more than the normalized "Referred out".
        label: r.statusDetail?.trim() || STATUS_LABELS[r.status] || r.status,
        tone: STATUS_TONES[r.status] ?? 'neutral',
      }),
      // Kanban by status: intake IS a pipeline, and dragging a card is how a
      // referral actually moves from new to consult scheduled.
      columns: STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s], tone: STATUS_TONES[s] })),
      getColumnKey: (r) => r.status,
      getDate: (r) => r.referralDate,
      getAddress: (r) =>
        r.addressLine1?.trim() || r.city?.trim()
          ? [r.addressLine1, r.city, r.state, r.postalCode].filter(Boolean).join(', ')
          : null,
      isFavorite: (r) => Boolean(r.isFavorite),
      isArchived: (r) => Boolean(r.archivedAt),
      fields: [
        {
          key: 'primary',
          label: 'Primary',
          render: (r) => [r.primaryFirstName, r.primaryLastName].filter(Boolean).join(' ') || '—',
        },
        {
          key: 'secondary',
          label: 'Secondary',
          render: (r) =>
            [r.secondaryFirstName, r.secondaryLastName].filter(Boolean).join(' ') || '—',
        },
        { key: 'phone', label: 'Phone', render: (r) => r.primaryPhone || '—' },
        {
          key: 'matter',
          label: 'Matter type',
          render: (r) => formatMatterTypes(r.matterType ?? '') || '—',
        },
        { key: 'referredBy', label: 'Referred by', render: (r) => r.referredBy || '—' },
        { key: 'attorney', label: 'Attorney', render: (r) => r.attorney || '—' },
        { key: 'date', label: 'Referral date', render: (r) => formatDateOnly(r.referralDate) },
        {
          key: 'status',
          label: 'Status',
          render: (r) => (
            <StatusPill tone={STATUS_TONES[r.status] ?? 'neutral'}>
              {STATUS_LABELS[r.status] ?? r.status}
            </StatusPill>
          ),
        },
      ],
    }),
    [],
  );

  const stats = useMemo(() => {
    const live = referrals.filter((r) => !r.archivedAt);
    return {
      total: live.length,
      newCount: live.filter((r) => r.status === 'new').length,
      scheduled: live.filter((r) => r.status === 'consult_scheduled').length,
      converted: live.filter((r) => r.status === 'converted').length,
    };
  }, [referrals]);

  const field = (
    key: keyof typeof EMPTY_FORM,
    label: string,
    placeholder?: string,
    type?: string,
  ) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type ?? 'text'}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <PageShell>
      <PageHeader
        eyebrow="Growth"
        title="Referrals"
        description="Every inquiry that reaches CFS — from attorneys, hospitals, families and the website."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setForm(EMPTY_FORM);
              setCreating(true);
            }}
          >
            <Plus className="size-4" /> Log referral
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Open referrals" value={String(stats.total)} icon={Share2} tone="brand" />
        <StatTile label="New" value={String(stats.newCount)} icon={UserPlus} tone="info" />
        <StatTile label="Consults scheduled" value={String(stats.scheduled)} icon={Scale} tone="warning" />
        <StatTile label="Converted" value={String(stats.converted)} icon={CheckCircle2} tone="good" />
      </div>

      {!provisioned ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium text-foreground">Database not provisioned yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Apply <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">20260721000005_referrals.sql</code>{' '}
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
                placeholder="Search names, referrers, attorneys…"
                className="pl-8"
              />
            </div>

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

          {notice && (
            <p className="mb-3 rounded-md bg-brand/10 px-3 py-2 text-sm text-brand">{notice}</p>
          )}
          {error && (
            <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          {loading ? (
            <p className="py-14 text-center text-sm text-muted-foreground">Loading referrals…</p>
          ) : (
            <DataViews
              mode={mode}
              items={referrals}
              config={config}
              onOpen={openEdit}
              onColumnChange={(r, status) => patch(r, { status })}
              emptyTitle="No referrals yet"
              emptyDescription="Log the first inquiry that reaches the practice."
              renderActions={(r) => (
                <ItemActions
                  label={r.clientName}
                  busy={busyId === r.id}
                  isFavorite={Boolean(r.isFavorite)}
                  isArchived={Boolean(r.archivedAt)}
                  onEdit={() => openEdit(r)}
                  onFavorite={(next) => toggleFavorite(r, next)}
                  onArchive={(next) => patch(r, { archived: next })}
                  onDelete={() => remove(r)}
                />
              )}
            />
          )}
        </>
      )}

      {/* Create / edit — the CFS referral sheet */}
      <Dialog
        open={creating || Boolean(editing)}
        onOpenChange={(v) => {
          if (!v) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.clientName}` : 'Log a referral'}</DialogTitle>
            <DialogDescription>
              Secondary fields are for the co-client — a spouse or partner who is party to the same
              matter.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Client name</Label>
              <Input
                value={form.clientName}
                onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                placeholder="The Okafor family"
                autoFocus
              />
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Parties
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {field('primaryFirstName', 'Primary first name')}
                {field('primaryLastName', 'Primary last name')}
                {field('secondaryFirstName', 'Secondary first name')}
                {field('secondaryLastName', 'Secondary last name')}
                {field('primaryEmail', 'Primary email', undefined, 'email')}
                {field('secondaryEmail', 'Secondary email', undefined, 'email')}
                {field('primaryPhone', 'Primary phone', undefined, 'tel')}
                {field('secondaryPhone', 'Secondary phone', undefined, 'tel')}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Address
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {field('addressLine1', 'Street address', '1234 E Camelback Rd')}
                {field('addressLine2', 'Unit / apt')}
                {field('city', 'City', 'Phoenix')}
                <div className="grid grid-cols-2 gap-3">
                  {field('state', 'State', 'AZ')}
                  {field('postalCode', 'ZIP', '85018')}
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Referral
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>
                    Matter type{' '}
                    <span className="font-normal text-muted-foreground">(any that apply)</span>
                  </Label>
                  <MultiCombobox
                    options={MATTER_OPTIONS}
                    value={parseMatterTypes(form.matterType)}
                    onChange={(v) => setForm((f) => ({ ...f, matterType: v.join(',') }))}
                    placeholder="Select matter types…"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Referral date</Label>
                    <DatePicker
                      value={form.referralDate}
                      onChange={(v) => setForm((f) => ({ ...f, referralDate: v }))}
                    />
                  </div>
                  {field('referredBy', 'Referred by', 'Behrmann & Assoc.')}
                  <div className="space-y-1.5">
                    <Label>Referral type</Label>
                    <Input
                      list="referral-types"
                      value={form.referralType}
                      onChange={(e) => setForm((f) => ({ ...f, referralType: e.target.value }))}
                      placeholder="PNFF"
                    />
                    <datalist id="referral-types">
                      {REFERRAL_TYPES.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {field('attorney', 'Attorney (as applicable)')}
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
                  <Label>Notes — appointment · focal</Label>
                  <textarea
                    value={form.appointmentNotes}
                    onChange={(e) => setForm((f) => ({ ...f, appointmentNotes: e.target.value }))}
                    rows={2}
                    className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none"
                  />
                </div>
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="flex-wrap gap-2">
            {editing && !editing.contactId && (
              <Button
                variant="outline"
                onClick={() => convert(editing)}
                disabled={busyId === editing.id}
              >
                <UserPlus className="size-4" /> Convert to contact
              </Button>
            )}
            {editing?.contactId && (
              <Button variant="outline" onClick={() => router.push(`/contacts/${editing.contactId}`)}>
                Open contact
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !form.clientName.trim()}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Log referral'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
