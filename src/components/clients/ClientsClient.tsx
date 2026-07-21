'use client';

/**
 * Clients & Wards — second consumer of the shared view layer.
 *
 * Everything visual here comes from components/views. This file is the
 * ViewConfig, the form, and the fetch calls; the five views, the action menu
 * and the upload panel are inherited from Matters.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, Plus, Search, Scale, Landmark, HeartPulse } from 'lucide-react';
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
import { AttachmentsPanel } from '@/components/views/AttachmentsPanel';
import { formatDateOnly } from '@/lib/dates';

const KINDS = ['individual', 'ward', 'estate', 'trust'] as const;
const KIND_LABELS: Record<string, string> = {
  individual: 'Individual',
  ward: 'Ward',
  estate: 'Estate',
  trust: 'Trust',
};

const ROLES = [
  'conservator',
  'guardian',
  'personal_representative',
  'trustee',
  'successor_trustee',
  'agent_poa',
] as const;
const ROLE_LABELS: Record<string, string> = {
  conservator: 'Conservator',
  guardian: 'Guardian',
  personal_representative: 'Personal representative',
  trustee: 'Trustee',
  successor_trustee: 'Successor trustee',
  agent_poa: 'Agent (POA)',
};

const STATUSES = ['onboarding', 'active', 'inactive', 'closed'] as const;
const STATUS_LABELS: Record<string, string> = {
  onboarding: 'Onboarding',
  active: 'Active',
  inactive: 'Inactive',
  closed: 'Closed',
};
const STATUS_TONES: Record<string, Tone> = {
  onboarding: 'warning',
  active: 'good',
  inactive: 'neutral',
  closed: 'neutral',
};

interface Client {
  id: string;
  displayName: string;
  matterId: string | null;
  matterRef: string | null;
  clientKind: string;
  fiduciaryRole: string;
  courtSupervised: boolean;
  status: string;
  residenceType: string | null;
  facilityName: string | null;
  roomNumber: string | null;
  appointedAt: string | null;
  nextReviewAt: string | null;
  notes: string | null;
  archivedAt: string | null;
  isFavorite?: boolean;
}

const EMPTY_FORM = {
  displayName: '',
  clientKind: 'individual',
  fiduciaryRole: 'trustee',
  status: 'onboarding',
  courtSupervised: false,
  residenceType: '',
  facilityName: '',
  roomNumber: '',
  appointedAt: '',
  nextReviewAt: '',
  notes: '',
};

export function ClientsClient() {
  const [clients, setClients] = useState<Client[]>([]);
  const [provisioned, setProvisioned] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [mode, setMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const [editing, setEditing] = useState<Client | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filesFor, setFilesFor] = useState<Client | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cfs_clients_view') as ViewMode | null;
    if (saved) setMode(saved);
  }, []);
  const changeMode = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem('cfs_clients_view', m);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set('search', search.trim());
      if (statusFilter) qs.set('status', statusFilter);
      if (roleFilter) qs.set('fiduciaryRole', roleFilter);
      if (showArchived) qs.set('includeArchived', 'true');
      const res = await fetch(`/api/clients?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load clients.');
      if (data.provisioned === false) {
        setProvisioned(false);
        setClients([]);
        return;
      }
      setProvisioned(true);
      setClients(Array.isArray(data.clients) ? data.clients : []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, roleFilter, showArchived]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        appointedAt: form.appointedAt || null,
        nextReviewAt: form.nextReviewAt || null,
      };
      const res = editing
        ? await fetch(`/api/clients/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the client.');
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

  async function patch(client: Client, body: Record<string, unknown>) {
    setBusyId(client.id);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
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

  async function toggleFavorite(client: Client, next: boolean) {
    setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, isFavorite: next } : c)));
    try {
      const res = await fetch('/api/collections/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'client', entityId: client.id, favorite: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not update the favorite.');
    } catch (err) {
      setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, isFavorite: !next } : c)));
      setError((err as Error).message);
    }
  }

  async function remove(client: Client) {
    setBusyId(client.id);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete the client.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  function openEdit(client: Client) {
    setEditing(client);
    setForm({
      displayName: client.displayName ?? '',
      clientKind: client.clientKind,
      fiduciaryRole: client.fiduciaryRole,
      status: client.status,
      courtSupervised: client.courtSupervised,
      residenceType: client.residenceType ?? '',
      facilityName: client.facilityName ?? '',
      roomNumber: client.roomNumber ?? '',
      appointedAt: client.appointedAt ?? '',
      nextReviewAt: client.nextReviewAt ? client.nextReviewAt.slice(0, 10) : '',
      notes: client.notes ?? '',
    });
  }

  const config: ViewConfig<Client> = useMemo(
    () => ({
      getId: (c) => c.id,
      getTitle: (c) => c.displayName,
      getSubtitle: (c) =>
        `${ROLE_LABELS[c.fiduciaryRole] ?? c.fiduciaryRole}${c.courtSupervised ? ' · court' : ''}`,
      getMeta: (c) =>
        c.nextReviewAt
          ? `Next review ${formatDateOnly(c.nextReviewAt)}`
          : c.facilityName || '',
      getBadge: (c) => ({
        label: STATUS_LABELS[c.status] ?? c.status,
        tone: STATUS_TONES[c.status] ?? 'neutral',
      }),
      // Grouped by fiduciary role: the board answers "who are we conservator
      // for?", which is the question staff actually ask.
      columns: ROLES.map((r) => ({ key: r, label: ROLE_LABELS[r], tone: 'neutral' as Tone })),
      getColumnKey: (c) => c.fiduciaryRole,
      getDate: (c) => c.nextReviewAt,
      isFavorite: (c) => Boolean(c.isFavorite),
      isArchived: (c) => Boolean(c.archivedAt),
      fields: [
        {
          key: 'role',
          label: 'Fiduciary role',
          render: (c) => (
            <span>
              {ROLE_LABELS[c.fiduciaryRole] ?? c.fiduciaryRole}
              {c.courtSupervised && <span className="ml-2 text-xs text-muted-foreground">· court</span>}
            </span>
          ),
        },
        { key: 'kind', label: 'Type', render: (c) => KIND_LABELS[c.clientKind] ?? c.clientKind },
        { key: 'matter', label: 'Matter', render: (c) => c.matterRef || '—' },
        {
          key: 'residence',
          label: 'Residence',
          render: (c) =>
            c.facilityName ? `${c.facilityName}${c.roomNumber ? ` · ${c.roomNumber}` : ''}` : '—',
        },
        {
          key: 'review',
          label: 'Next review',
          render: (c) => formatDateOnly(c.nextReviewAt),
        },
        {
          key: 'status',
          label: 'Status',
          render: (c) => (
            <StatusPill tone={STATUS_TONES[c.status] ?? 'neutral'}>
              {STATUS_LABELS[c.status] ?? c.status}
            </StatusPill>
          ),
        },
      ],
    }),
    [],
  );

  const stats = useMemo(() => {
    const live = clients.filter((c) => !c.archivedAt);
    return {
      active: live.filter((c) => c.status === 'active').length,
      supervised: live.filter((c) => c.courtSupervised).length,
      trusts: live.filter((c) => c.clientKind === 'trust').length,
      onboarding: live.filter((c) => c.status === 'onboarding').length,
    };
  }, [clients]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Caseload"
        title="Clients & Wards"
        description="Every protected person and estate CFS is responsible for stewarding."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setForm(EMPTY_FORM);
              setCreating(true);
            }}
          >
            <Plus className="size-4" /> Add client
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Total active" value={String(stats.active)} icon={Users} tone="brand" />
        <StatTile label="Court-supervised" value={String(stats.supervised)} icon={Scale} hint="Conservator / Guardian / PR" />
        <StatTile label="Trusts under admin" value={String(stats.trusts)} icon={Landmark} />
        <StatTile label="Onboarding" value={String(stats.onboarding)} icon={HeartPulse} tone="warning" />
      </div>

      {!provisioned ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium text-foreground">Database not provisioned yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Apply <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">20260721000002_clients.sql</code>{' '}
            (after the matters migration) in the Supabase SQL editor.
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
                placeholder="Search clients, facilities…"
                className="pl-8"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-secondary px-2.5 text-sm text-foreground"
            >
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
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
            <p className="py-14 text-center text-sm text-muted-foreground">Loading clients…</p>
          ) : (
            <DataViews
              mode={mode}
              items={clients}
              config={config}
              onOpen={openEdit}
              onColumnChange={(c, role) => patch(c, { fiduciaryRole: role })}
              emptyTitle="No clients yet"
              emptyDescription="Add the first client or ward CFS is appointed for."
              renderActions={(c) => (
                <ItemActions
                  label={c.displayName}
                  busy={busyId === c.id}
                  isFavorite={Boolean(c.isFavorite)}
                  isArchived={Boolean(c.archivedAt)}
                  onEdit={() => openEdit(c)}
                  onFavorite={(next) => toggleFavorite(c, next)}
                  onAttach={() => setFilesFor(c)}
                  onShare={() => setFilesFor(c)}
                  onArchive={(next) => patch(c, { archived: next })}
                  onDelete={() => remove(c)}
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
            <DialogTitle>{editing ? `Edit ${editing.displayName}` : 'Add a client or ward'}</DialogTitle>
            <DialogDescription>
              Clients can be people, estates or trusts — the name is what appears throughout the app.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Client name</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="Eleanor V. Prescott, or Whitfield Family Trust"
                autoFocus
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
                  value={form.clientKind}
                  onChange={(e) => setForm((f) => ({ ...f, clientKind: e.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {KIND_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Fiduciary role</Label>
                <select
                  value={form.fiduciaryRole}
                  onChange={(e) => setForm((f) => ({ ...f, fiduciaryRole: e.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
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
              <label className="flex items-end gap-2 pb-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.courtSupervised}
                  onChange={(e) => setForm((f) => ({ ...f, courtSupervised: e.target.checked }))}
                  className="size-4 accent-current"
                />
                Court-supervised
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Residence type</Label>
                <Input
                  value={form.residenceType}
                  onChange={(e) => setForm((f) => ({ ...f, residenceType: e.target.value }))}
                  placeholder="Memory care"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Facility</Label>
                <Input
                  value={form.facilityName}
                  onChange={(e) => setForm((f) => ({ ...f, facilityName: e.target.value }))}
                  placeholder="Desert Vista"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Room</Label>
                <Input
                  value={form.roomNumber}
                  onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))}
                  placeholder="204B"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Appointed</Label>
                <DatePicker
                  value={form.appointedAt}
                  onChange={(v) => setForm((f) => ({ ...f, appointedAt: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Next review</Label>
                <DatePicker
                  value={form.nextReviewAt}
                  onChange={(v) => setForm((f) => ({ ...f, nextReviewAt: v }))}
                />
              </div>
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

            {editing && (
              <div className="border-t border-border pt-4">
                <Label className="mb-2 block">Files</Label>
                <AttachmentsPanel entityType="client" entityId={editing.id} />
              </div>
            )}
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
            <Button onClick={save} disabled={saving || !form.displayName.trim()}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Files */}
      <Dialog open={Boolean(filesFor)} onOpenChange={(v) => !v && setFilesFor(null)}>
        <DialogContent className="max-w-lg bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Files — {filesFor?.displayName}</DialogTitle>
            <DialogDescription>
              Stored privately. Download links are short-lived and expire.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {filesFor && <AttachmentsPanel entityType="client" entityId={filesFor.id} />}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
