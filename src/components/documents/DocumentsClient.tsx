'use client';

/**
 * Documents — the file library for clients and matters.
 *
 * Differs from Matters and Clients in one way: the upload IS the record, so
 * "Add document" takes a file in the same step rather than creating a row and
 * attaching to it afterwards.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Plus, Search, Upload, ShieldAlert, Clock, Loader2 } from 'lucide-react';
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
import { formatDateOnly, parseLocalDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

const DOC_TYPES = [
  'court_filing',
  'legal',
  'medical',
  'financial',
  'insurance',
  'identification',
  'correspondence',
  'other',
] as const;
const TYPE_LABELS: Record<string, string> = {
  court_filing: 'Court filing',
  legal: 'Legal',
  medical: 'Medical',
  financial: 'Financial',
  insurance: 'Insurance',
  identification: 'Identification',
  correspondence: 'Correspondence',
  other: 'Other',
};

const STATUSES = ['draft', 'final', 'filed', 'expired'] as const;
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  final: 'Final',
  filed: 'Filed',
  expired: 'Expired',
};
const STATUS_TONES: Record<string, Tone> = {
  draft: 'warning',
  final: 'good',
  filed: 'info',
  expired: 'critical',
};

interface Doc {
  id: string;
  title: string;
  docType: string;
  status: string;
  clientId: string | null;
  clientName: string | null;
  clientCity: string | null;
  clientState: string | null;
  matterRef: string | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  effectiveAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  archivedAt: string | null;
  url?: string | null;
  isFavorite?: boolean;
}

const EMPTY_FORM = {
  title: '',
  docType: 'other',
  status: 'draft',
  effectiveAt: '',
  expiresAt: '',
  notes: '',
};

function formatBytes(n: number | null): string {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Days until expiry, or null when there is no expiry. */
function daysUntil(value: string | null): number | null {
  const d = parseLocalDate(value);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export function DocumentsClient() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [provisioned, setProvisioned] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [mode, setMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const [editing, setEditing] = useState<Doc | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cfs_documents_view') as ViewMode | null;
    if (saved) setMode(saved);
  }, []);
  const changeMode = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem('cfs_documents_view', m);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set('search', search.trim());
      if (typeFilter) qs.set('docType', typeFilter);
      if (statusFilter) qs.set('status', statusFilter);
      if (showArchived) qs.set('includeArchived', 'true');
      const res = await fetch(`/api/client-documents?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load documents.');
      if (data.provisioned === false) {
        setProvisioned(false);
        setDocs([]);
        return;
      }
      setProvisioned(true);
      setDocs(Array.isArray(data.documents) ? data.documents : []);
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
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const res = await fetch(`/api/client-documents/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            effectiveAt: form.effectiveAt || null,
            expiresAt: form.expiresAt || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not save the document.');
      } else {
        // Create and upload in one request — see the route comment.
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        if (file) fd.append('file', file);
        const res = await fetch('/api/client-documents', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not add the document.');
      }
      setEditing(null);
      setCreating(false);
      setForm(EMPTY_FORM);
      setFile(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function patch(doc: Doc, body: Record<string, unknown>) {
    setBusyId(doc.id);
    try {
      const res = await fetch(`/api/client-documents/${doc.id}`, {
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

  async function toggleFavorite(doc: Doc, next: boolean) {
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, isFavorite: next } : d)));
    try {
      const res = await fetch('/api/collections/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'document', entityId: doc.id, favorite: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not update the favorite.');
    } catch (err) {
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, isFavorite: !next } : d)));
      setError((err as Error).message);
    }
  }

  async function remove(doc: Doc) {
    setBusyId(doc.id);
    try {
      const res = await fetch(`/api/client-documents/${doc.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete the document.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  function openEdit(doc: Doc) {
    setEditing(doc);
    setForm({
      title: doc.title ?? '',
      docType: doc.docType,
      status: doc.status,
      effectiveAt: doc.effectiveAt ?? '',
      expiresAt: doc.expiresAt ?? '',
      notes: doc.notes ?? '',
    });
  }

  const config: ViewConfig<Doc> = useMemo(
    () => ({
      getId: (d) => d.id,
      getTitle: (d) => d.title,
      getSubtitle: (d) =>
        [TYPE_LABELS[d.docType] ?? d.docType, d.clientName, d.matterRef]
          .filter(Boolean)
          .join(' · '),
      getMeta: (d) => {
        const days = daysUntil(d.expiresAt);
        if (days !== null && days <= 60) {
          return days < 0 ? `Expired ${-days}d ago` : `Expires in ${days}d`;
        }
        return d.fileName ? `${d.fileName} · ${formatBytes(d.sizeBytes)}` : 'No file';
      },
      getBadge: (d) => ({
        label: STATUS_LABELS[d.status] ?? d.status,
        tone: STATUS_TONES[d.status] ?? 'neutral',
      }),
      // Grouped by type: "show me every court filing" is the question staff
      // ask of a document library, more than "show me every draft".
      columns: DOC_TYPES.map((t) => ({ key: t, label: TYPE_LABELS[t], tone: 'neutral' as Tone })),
      getColumnKey: (d) => d.docType,
      // Expiry, not creation: a lapsed POA or bond is the thing worth seeing
      // on a calendar before it happens.
      getDate: (d) => d.expiresAt,
      // Documents have no address of their own; they inherit the client's
      // location so the map answers "whose documents are where".
      getAddress: (d) =>
        d.clientCity?.trim() ? [d.clientCity, d.clientState].filter(Boolean).join(', ') : null,
      isFavorite: (d) => Boolean(d.isFavorite),
      isArchived: (d) => Boolean(d.archivedAt),
      fields: [
        { key: 'type', label: 'Type', render: (d) => TYPE_LABELS[d.docType] ?? d.docType },
        { key: 'client', label: 'Client', render: (d) => d.clientName || '—' },
        { key: 'matter', label: 'Matter', render: (d) => d.matterRef || '—' },
        {
          key: 'file',
          label: 'File',
          render: (d) =>
            d.url ? (
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                {d.fileName || 'Download'}
              </a>
            ) : (
              <span className="text-muted-foreground">No file</span>
            ),
        },
        { key: 'expires', label: 'Expires', render: (d) => formatDateOnly(d.expiresAt) },
        {
          key: 'status',
          label: 'Status',
          render: (d) => (
            <StatusPill tone={STATUS_TONES[d.status] ?? 'neutral'}>
              {STATUS_LABELS[d.status] ?? d.status}
            </StatusPill>
          ),
        },
      ],
    }),
    [],
  );

  const stats = useMemo(() => {
    const live = docs.filter((d) => !d.archivedAt);
    const expiringSoon = live.filter((d) => {
      const days = daysUntil(d.expiresAt);
      return days !== null && days >= 0 && days <= 30;
    }).length;
    const expired = live.filter((d) => {
      const days = daysUntil(d.expiresAt);
      return days !== null && days < 0;
    }).length;
    return {
      total: live.length,
      filings: live.filter((d) => d.docType === 'court_filing').length,
      expiringSoon,
      expired,
    };
  }, [docs]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Practice"
        title="Documents"
        description="Court filings, medical records and financial statements, filed against the client or matter they belong to."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setForm(EMPTY_FORM);
              setFile(null);
              setCreating(true);
            }}
          >
            <Plus className="size-4" /> Add document
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Documents" value={String(stats.total)} icon={FileText} tone="brand" />
        <StatTile label="Court filings" value={String(stats.filings)} icon={FileText} />
        <StatTile label="Expiring ≤30d" value={String(stats.expiringSoon)} icon={Clock} tone="warning" />
        <StatTile label="Expired" value={String(stats.expired)} icon={ShieldAlert} tone={stats.expired ? 'critical' : 'default'} />
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
                placeholder="Search titles, files, notes…"
                className="pl-8"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-secondary px-2.5 text-sm text-foreground"
            >
              <option value="">All types</option>
              {DOC_TYPES.map((t) => (
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
            <p className="py-14 text-center text-sm text-muted-foreground">Loading documents…</p>
          ) : (
            <DataViews
              mode={mode}
              items={docs}
              config={config}
              onOpen={openEdit}
              onColumnChange={(d, docType) => patch(d, { docType })}
              emptyTitle="No documents yet"
              emptyDescription="Upload the first filing, record or statement."
              renderActions={(d) => (
                <ItemActions
                  label={d.title}
                  busy={busyId === d.id}
                  isFavorite={Boolean(d.isFavorite)}
                  isArchived={Boolean(d.archivedAt)}
                  onEdit={() => openEdit(d)}
                  onFavorite={(next) => toggleFavorite(d, next)}
                  onArchive={(next) => patch(d, { archived: next })}
                  onDelete={() => remove(d)}
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
            <DialogTitle>{editing ? `Edit ${editing.title}` : 'Add a document'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Details only — the stored file cannot be swapped. Add a new document instead so the original is preserved.'
                : 'The file uploads with the record. Stored privately; links expire.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {!editing && (
              <div
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center transition-colors hover:bg-secondary/30',
                  file ? 'border-brand bg-brand/5' : 'border-border hover:border-brand/50',
                )}
              >
                <Upload className="size-5 text-muted-foreground" />
                <p className="text-sm text-foreground">
                  {file ? file.name : 'Choose a file, or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {file ? formatBytes(file.size) : 'Up to 25 MB'}
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    // Save typing: default the title to the file name.
                    if (f && !form.title.trim()) {
                      setForm((prev) => ({ ...prev, title: f.name.replace(/\.[^.]+$/, '') }));
                    }
                  }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Annual accounting — Prescott"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
                  value={form.docType}
                  onChange={(e) => setForm((f) => ({ ...f, docType: e.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
                >
                  {DOC_TYPES.map((t) => (
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
                <Label>Effective</Label>
                <DatePicker
                  value={form.effectiveAt}
                  onChange={(v) => setForm((f) => ({ ...f, effectiveAt: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Expires</Label>
                <DatePicker
                  value={form.expiresAt}
                  onChange={(v) => setForm((f) => ({ ...f, expiresAt: v }))}
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
            <Button onClick={save} disabled={saving || !form.title.trim()}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
