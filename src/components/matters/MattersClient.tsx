'use client';

/**
 * Matters — the reference implementation of the shared view layer.
 *
 * Five views, per-record actions, file upload and sharing, all driven by one
 * ViewConfig. The other dashboard pages should follow this shape.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Landmark, Plus, Search, Scale, ScrollText, Archive } from 'lucide-react';
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
import {
  DataViews,
  ViewSwitcher,
  type ViewMode,
  type ViewConfig,
} from '@/components/views/DataViews';
import { ItemActions } from '@/components/views/ItemActions';
import { AttachmentsPanel } from '@/components/views/AttachmentsPanel';

/* --------------------------------- Types --------------------------------- */

const MATTER_TYPES = [
  'conservatorship',
  'guardianship',
  'estate_administration',
  'trust_administration',
  'power_of_attorney',
  'special_needs_trust',
] as const;

const TYPE_LABELS: Record<string, string> = {
  conservatorship: 'Conservatorship',
  guardianship: 'Guardianship',
  estate_administration: 'Estate administration',
  trust_administration: 'Trust administration',
  power_of_attorney: 'Power of attorney',
  special_needs_trust: 'Special needs trust',
};

const STATUSES = ['onboarding', 'active', 'court_supervision', 'closed'] as const;

const STATUS_LABELS: Record<string, string> = {
  onboarding: 'Onboarding',
  active: 'Active',
  court_supervision: 'Court supervision',
  closed: 'Closed',
};

const STATUS_TONES: Record<string, Tone> = {
  onboarding: 'warning',
  active: 'good',
  court_supervision: 'info',
  closed: 'neutral',
};

interface Matter {
  id: string;
  matterRef: string;
  title: string | null;
  matterType: string;
  status: string;
  clientName: string | null;
  venue: string | null;
  courtCaseNumber: string | null;
  openedAt: string | null;
  nextDeadlineAt: string | null;
  notes: string | null;
  archivedAt: string | null;
  isFavorite?: boolean;
}

const EMPTY_FORM = {
  matterRef: '',
  title: '',
  matterType: 'trust_administration',
  status: 'onboarding',
  clientName: '',
  venue: '',
  courtCaseNumber: '',
  openedAt: '',
  nextDeadlineAt: '',
  notes: '',
};

/* -------------------------------- Component ------------------------------ */

export function MattersClient() {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [provisioned, setProvisioned] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [mode, setMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const [editing, setEditing] = useState<Matter | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filesFor, setFilesFor] = useState<Matter | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Restore the view preference; people pick one and keep it.
  useEffect(() => {
    const saved = localStorage.getItem('cfs_matters_view') as ViewMode | null;
    if (saved) setMode(saved);
  }, []);
  const changeMode = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem('cfs_matters_view', m);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set('search', search.trim());
      if (statusFilter) qs.set('status', statusFilter);
      if (showArchived) qs.set('includeArchived', 'true');
      const res = await fetch(`/api/matters?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load matters.');
      if (data.provisioned === false) {
        setProvisioned(false);
        setMatters([]);
        return;
      }
      setProvisioned(true);
      setMatters(Array.isArray(data.matters) ? data.matters : []);
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

  /* ------------------------------- Actions ------------------------------- */

  async function save() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        openedAt: form.openedAt || null,
        nextDeadlineAt: form.nextDeadlineAt || null,
      };
      const res = editing
        ? await fetch(`/api/matters/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/matters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the matter.');
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

  async function patch(matter: Matter, body: Record<string, unknown>) {
    setBusyId(matter.id);
    try {
      const res = await fetch(`/api/matters/${matter.id}`, {
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

  async function toggleFavorite(matter: Matter, next: boolean) {
    // Optimistic: favoriting should feel instant.
    setMatters((prev) => prev.map((m) => (m.id === matter.id ? { ...m, isFavorite: next } : m)));
    try {
      const res = await fetch('/api/collections/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'matter', entityId: matter.id, favorite: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not update the favorite.');
    } catch (err) {
      setMatters((prev) => prev.map((m) => (m.id === matter.id ? { ...m, isFavorite: !next } : m)));
      setError((err as Error).message);
    }
  }

  async function remove(matter: Matter) {
    setBusyId(matter.id);
    try {
      const res = await fetch(`/api/matters/${matter.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete the matter.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  function openEdit(matter: Matter) {
    setEditing(matter);
    setForm({
      matterRef: matter.matterRef ?? '',
      title: matter.title ?? '',
      matterType: matter.matterType,
      status: matter.status,
      clientName: matter.clientName ?? '',
      venue: matter.venue ?? '',
      courtCaseNumber: matter.courtCaseNumber ?? '',
      openedAt: matter.openedAt ?? '',
      nextDeadlineAt: matter.nextDeadlineAt ? matter.nextDeadlineAt.slice(0, 10) : '',
      notes: matter.notes ?? '',
    });
  }

  /* ------------------------------ View config ---------------------------- */

  const config: ViewConfig<Matter> = useMemo(
    () => ({
      getId: (m) => m.id,
      getTitle: (m) => m.matterRef,
      getSubtitle: (m) => m.clientName || m.title || TYPE_LABELS[m.matterType],
      getMeta: (m) =>
        m.nextDeadlineAt
          ? `Next deadline ${new Date(m.nextDeadlineAt).toLocaleDateString()}`
          : m.venue || '',
      getBadge: (m) => ({ label: STATUS_LABELS[m.status] ?? m.status, tone: STATUS_TONES[m.status] ?? 'neutral' }),
      columns: STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s], tone: STATUS_TONES[s] })),
      getColumnKey: (m) => m.status,
      getDate: (m) => m.nextDeadlineAt,
      isFavorite: (m) => Boolean(m.isFavorite),
      isArchived: (m) => Boolean(m.archivedAt),
      fields: [
        { key: 'client', label: 'Client', render: (m) => m.clientName || '—' },
        { key: 'type', label: 'Type', render: (m) => TYPE_LABELS[m.matterType] ?? m.matterType },
        { key: 'venue', label: 'Venue', render: (m) => m.venue || '—' },
        { key: 'case', label: 'Case no.', render: (m) => m.courtCaseNumber || '—' },
        {
          key: 'status',
          label: 'Status',
          render: (m) => (
            <StatusPill tone={STATUS_TONES[m.status] ?? 'neutral'}>
              {STATUS_LABELS[m.status] ?? m.status}
            </StatusPill>
          ),
        },
        {
          key: 'deadline',
          label: 'Next deadline',
          render: (m) =>
            m.nextDeadlineAt ? new Date(m.nextDeadlineAt).toLocaleDateString() : '—',
        },
      ],
    }),
    [],
  );

  const stats = useMemo(() => {
    const open = matters.filter((m) => m.status !== 'closed' && !m.archivedAt).length;
    const supervised = matters.filter((m) => m.status === 'court_supervision').length;
    const estates = matters.filter((m) => m.matterType === 'estate_administration').length;
    const favorites = matters.filter((m) => m.isFavorite).length;
    return { open, supervised, estates, favorites };
  }, [matters]);

  /* -------------------------------- Render ------------------------------- */

  return (
    <PageShell>
      <PageHeader
        eyebrow="Caseload"
        title="Matters"
        description="Each engagement CFS manages — trusts, estates, and court-appointed roles — as its own file."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setForm(EMPTY_FORM);
              setCreating(true);
            }}
          >
            <Plus className="size-4" /> Open matter
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Open matters" value={String(stats.open)} icon={Landmark} tone="brand" />
        <StatTile label="Court-supervised" value={String(stats.supervised)} icon={Scale} hint="Reporting to the court" tone="warning" />
        <StatTile label="Estates in admin" value={String(stats.estates)} icon={ScrollText} />
        <StatTile label="Favorites" value={String(stats.favorites)} icon={Archive} />
      </div>

      {!provisioned ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium text-foreground">Database not provisioned yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Apply <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">20260721000001_matters.sql</code>{' '}
            in the Supabase SQL editor to create the matters tables and the attachments bucket.
          </p>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search matters, clients, case numbers…"
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

          {error && (
            <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          {loading ? (
            <p className="py-14 text-center text-sm text-muted-foreground">Loading matters…</p>
          ) : (
            <DataViews
              mode={mode}
              items={matters}
              config={config}
              onOpen={openEdit}
              onColumnChange={(m, status) => patch(m, { status })}
              emptyTitle="No matters yet"
              emptyDescription="Open the first matter to start the caseload."
              renderActions={(m) => (
                <ItemActions
                  label={m.matterRef}
                  busy={busyId === m.id}
                  isFavorite={Boolean(m.isFavorite)}
                  isArchived={Boolean(m.archivedAt)}
                  onEdit={() => openEdit(m)}
                  onFavorite={(next) => toggleFavorite(m, next)}
                  onAttach={() => setFilesFor(m)}
                  onShare={() => setFilesFor(m)}
                  onArchive={(next) => patch(m, { archived: next })}
                  onDelete={() => remove(m)}
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
            <DialogTitle>{editing ? `Edit ${editing.matterRef}` : 'Open a matter'}</DialogTitle>
            <DialogDescription>
              One file per engagement. The matter reference is your own file number and must be unique.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Matter reference</Label>
                <Input
                  value={form.matterRef}
                  onChange={(e) => setForm((f) => ({ ...f, matterRef: e.target.value }))}
                  placeholder="PB2026-0142"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Client name</Label>
                <Input
                  value={form.clientName}
                  onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                  placeholder="Eleanor V. Prescott"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Short description of the engagement"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Matter type</Label>
                <select
                  value={form.matterType}
                  onChange={(e) => setForm((f) => ({ ...f, matterType: e.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
                >
                  {MATTER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Venue</Label>
                <Input
                  value={form.venue}
                  onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                  placeholder="Maricopa County"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Court case number</Label>
                <Input
                  value={form.courtCaseNumber}
                  onChange={(e) => setForm((f) => ({ ...f, courtCaseNumber: e.target.value }))}
                  placeholder="PB2026-0142"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Opened</Label>
                <DatePicker
                  value={form.openedAt}
                  onChange={(v) => setForm((f) => ({ ...f, openedAt: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Next deadline</Label>
                <DatePicker
                  value={form.nextDeadlineAt}
                  onChange={(v) => setForm((f) => ({ ...f, nextDeadlineAt: v }))}
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
                <AttachmentsPanel entityType="matter" entityId={editing.id} />
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
            <Button onClick={save} disabled={saving || !form.matterRef.trim()}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Open matter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Files (from the action menu) */}
      <Dialog open={Boolean(filesFor)} onOpenChange={(v) => !v && setFilesFor(null)}>
        <DialogContent className="max-w-lg bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Files — {filesFor?.matterRef}</DialogTitle>
            <DialogDescription>
              Stored privately. Download links are short-lived and expire.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {filesFor && <AttachmentsPanel entityType="matter" entityId={filesFor.id} />}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
