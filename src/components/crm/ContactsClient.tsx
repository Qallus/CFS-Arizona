'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Plus,
  Upload,
  Table as TableIcon,
  LayoutList,
  LayoutGrid,
  CalendarDays,
  Columns3,
  MapPin,
  Share2,
  Moon,
  Download,
  ChevronsLeft,
  ChevronsRight,
  Database,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import type { MapViewProps } from '@/components/views/MapView';

// Leaflet touches `window` at import time, so it cannot render on the server.
const LazyMapView = dynamic(() => import('@/components/views/MapView'), {
  ssr: false,
  loading: () => <p className="py-14 text-center text-sm text-muted-foreground">Loading map…</p>,
}) as <T>(props: MapViewProps<T>) => React.ReactNode;
import { AddContactModal } from './AddContactModal';
import { ImportContactsModal } from './ImportContactsModal';
import {
  STAGES,
  TABS,
  type TabKey,
  type Stage,
  type Disposition,
  stageLabel,
  stageTone,
  dispositionLabel,
  dispositionTone,
  formatMatterTypes,
  matchesTab,
  contactDisplayName,
} from './crm-meta';

interface ContactSummary {
  id: string;
  source: string | null;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  matterType: string | null;
  referralSource: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
}
interface Opportunity {
  id: string;
  contactId: string;
  stage: Stage;
  disposition: Disposition;
  nextFollowUpAt: string | null;
  contact: ContactSummary | null;
}

type ViewKey = 'list' | 'table' | 'kanban' | 'cards' | 'calendar' | 'map';
// Order matches the shared ViewSwitcher used by Clients & Wards and Matters,
// so the control does not reshuffle as you move between pages.
const VIEWS: { key: ViewKey; label: string; icon: typeof TableIcon }[] = [
  { key: 'list', label: 'List', icon: LayoutList },
  { key: 'table', label: 'Table', icon: TableIcon },
  { key: 'kanban', label: 'Kanban', icon: Columns3 },
  { key: 'cards', label: 'Cards', icon: LayoutGrid },
  { key: 'calendar', label: 'Calendar', icon: CalendarDays },
  { key: 'map', label: 'Map', icon: MapPin },
];

/** Single-line address for geocoding, or null when there is nothing to map. */
function contactAddress(c: ContactSummary | null): string | null {
  if (!c) return null;
  const parts = [c.addressLine1, c.city, c.state, c.zipCode].map((p) => (p ?? '').trim()).filter(Boolean);
  // A bare state or zip geocodes to the middle of a state — worse than no pin.
  if (!c.addressLine1?.trim() && !c.city?.trim()) return null;
  return parts.join(', ');
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

export function ContactsClient() {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [provisioned, setProvisioned] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [exporting, setExporting] = useState(false);
  const [view, setView] = useState<ViewKey>('list');
  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/opportunities');
      const data = await res.json();
      setProvisioned(data.provisioned !== false);
      setTotal(typeof data.total === 'number' ? data.total : 0);
      setOpps(Array.isArray(data.opportunities) ? data.opportunities : []);
    } catch {
      setProvisioned(true);
      setOpps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const moveStage = useCallback(
    async (id: string, stage: Stage) => {
      // optimistic
      setOpps((cur) => cur.map((o) => (o.id === id ? { ...o, stage, disposition: 'active' } : o)));
      await fetch(`/api/crm/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      }).catch(() => {});
      load();
    },
    [load],
  );

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return opps;
    return opps.filter((o) => {
      const name = contactDisplayName(o.contact).toLowerCase();
      return name.includes(q) || (o.contact?.email ?? '').toLowerCase().includes(q);
    });
  }, [opps, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of TABS)
      c[t.key] = searched.filter((o) => matchesTab({ ...o, source: o.contact?.source }, t.key)).length;
    return c;
  }, [searched]);

  /**
   * Stat cards chosen to be actionable rather than decorative: how much of
   * the caseload is live, what came from referrals, what needs chasing this
   * week, and what has gone quiet. "Total contacts" is not a number anyone
   * does anything about.
   */
  const stats = useMemo(() => {
    const live = opps.filter(
      (o) => o.disposition !== 'exit' && !o.disposition.startsWith('dormant'),
    );
    const weekOut = Date.now() + 7 * 86_400_000;
    const dueSoon = live.filter((o) => {
      if (!o.nextFollowUpAt) return false;
      return new Date(o.nextFollowUpAt).getTime() <= weekOut;
    }).length;
    return {
      active: live.length,
      fromReferral: opps.filter((o) =>
        ['referral', 'pnff_2025'].includes(o.contact?.source ?? ''),
      ).length,
      dueSoon,
      dormant: opps.filter((o) => o.disposition.startsWith('dormant')).length,
    };
  }, [opps]);

  const visible = useMemo(
    () => searched.filter((o) => matchesTab({ ...o, source: o.contact?.source }, tab)),
    [searched, tab],
  );

  // Kanban, calendar and map are aggregate views — paging them would hide the
  // shape of the data, which is the whole reason to look at them.
  const PAGED_VIEWS: ViewKey[] = ['list', 'table', 'cards'];
  const paged = PAGED_VIEWS.includes(view);
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () =>
      paged
        ? visible.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : visible,
    [visible, paged, currentPage, pageSize],
  );

  // Any change to what is being filtered invalidates the page number.
  useEffect(() => {
    setPage(1);
  }, [tab, search, view, pageSize]);

  /** Export exactly what is on screen — same tab, same search. */
  async function exportCsv() {
    setExporting(true);
    try {
      const res = await fetch('/api/crm/contacts/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: visible.map((o) => o.contactId) }),
      });
      if (!res.ok) throw new Error('Export failed.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cfs-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      /* the browser reports a failed download itself */
    } finally {
      setExporting(false);
    }
  }

  if (!loading && !provisioned) {
    return (
      <PageShell>
        <PageHeader eyebrow="Caseload" title="Contacts" description="The people CFS carries from first contact through active client." />
        <EmptyState
          icon={Database}
          title="Database not provisioned yet"
          description="Apply the CRM migrations (supabase/migrations) to your Supabase, then add or import contacts."
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Caseload"
        title="Contacts"
        description="One continuous record per person — from first inquiry through active future-fee client."
        actions={
          <>
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts…"
                className="h-9 w-48 rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:w-56"
              />
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="size-4" /> Import
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={exportCsv}
              disabled={exporting || visible.length === 0}
              title={`Export the ${visible.length} contacts currently shown`}
            >
              <Download className="size-4" /> {exporting ? 'Exporting…' : 'Export'}
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="size-4" /> Add contact
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Active contacts" value={String(stats.active)} icon={Users} tone="brand" />
        <StatTile label="From referrals" value={String(stats.fromReferral)} icon={Share2} />
        <StatTile
          label="Follow-up due ≤7d"
          value={String(stats.dueSoon)}
          icon={CalendarDays}
          tone={stats.dueSoon ? 'warning' : 'default'}
        />
        <StatTile label="Dormant" value={String(stats.dormant)} icon={Moon} tone="default" />
      </div>

      {total > opps.length && (
        <p className="mb-3 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          Showing {opps.length} of {total} contacts. Narrow the search to see the rest.
        </p>
      )}

      {/* Tabs + view switcher */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                tab === t.key ? 'bg-brand text-brand-foreground' : 'bg-secondary/60 text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              <span className={cn('tabular-nums', tab === t.key ? 'opacity-80' : 'opacity-60')}>{counts[t.key] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1 self-start rounded-lg border border-border p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              title={v.label}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors',
                view === v.key ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <v.icon className="size-4" />
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SectionCard><p className="py-10 text-center text-sm text-muted-foreground">Loading contacts…</p></SectionCard>
      ) : opps.length === 0 ? (
        <EmptyState icon={Users} title="No contacts yet" description="Add or import contacts to start the funnel." />
      ) : view === 'table' ? (
        <TableView rows={pageRows} />
      ) : view === 'list' ? (
        <ListView rows={pageRows} />
      ) : view === 'cards' ? (
        <CardsView rows={pageRows} />
      ) : view === 'calendar' ? (
        <CalendarView rows={visible} />
      ) : view === 'map' ? (
        <ContactsMap rows={visible} />
      ) : (
        <KanbanView rows={searched} onMove={moveStage} />
      )}

      {paged && visible.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, visible.length)} of{' '}
            {visible.length}
          </p>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-9 rounded-md border border-border bg-secondary px-2 text-sm text-foreground"
              aria-label="Contacts per page"
            >
              {[25, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
                aria-label="First page"
              >
                <ChevronsLeft className="size-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-2 text-sm tabular-nums text-foreground">
                {currentPage} / {pageCount}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </button>
              <button
                onClick={() => setPage(pageCount)}
                disabled={currentPage === pageCount}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
                aria-label="Last page"
              >
                <ChevronsRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <AddContactModal open={showAdd} onOpenChange={setShowAdd} onCreated={load} />
      <ImportContactsModal open={showImport} onOpenChange={setShowImport} onImported={load} />
    </PageShell>
  );
}

/* ------------------------------- Table view ------------------------------ */
function TableView({ rows }: { rows: Opportunity[] }) {
  if (rows.length === 0) return <EmptyState icon={Users} title="Nothing in this tab" />;
  return (
    <SectionCard bodyClassName="p-0">
      <TableWrap>
        <thead>
          <tr>
            <Th>Contact</Th>
            <Th>Stage</Th>
            <Th>Disposition</Th>
            <Th>Matter</Th>
            <Th>Next follow-up</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <Tr key={o.id}>
              <Td>
                <Link href={`/contacts/${o.contactId}`} className="flex items-center gap-3 hover:underline">
                  <Avatar name={contactDisplayName(o.contact)} />
                  <span className="font-medium text-foreground">{contactDisplayName(o.contact)}</span>
                </Link>
              </Td>
              <Td><StatusPill tone={stageTone[o.stage]}>{stageLabel[o.stage]}</StatusPill></Td>
              <Td><StatusPill tone={dispositionTone[o.disposition]}>{dispositionLabel[o.disposition]}</StatusPill></Td>
              <Td className="text-muted-foreground">{formatMatterTypes(o.contact?.matterType) || '—'}</Td>
              <Td className="text-muted-foreground">{fmtDate(o.nextFollowUpAt)}</Td>
              <Td className="text-right">
                <Link href={`/contacts/${o.contactId}`} className="inline-flex text-muted-foreground hover:text-foreground">
                  <ArrowRight className="size-4" />
                </Link>
              </Td>
            </Tr>
          ))}
        </tbody>
      </TableWrap>
    </SectionCard>
  );
}

/* -------------------------------- List view ------------------------------ */
/* Compact, single-column stacked rows (distinct from the columnar Table and
   the Cards grid). */
function ListView({ rows }: { rows: Opportunity[] }) {
  if (rows.length === 0) return <EmptyState icon={Users} title="Nothing in this tab" />;
  return (
    <SectionCard bodyClassName="p-0">
      <ul className="divide-y divide-border">
        {rows.map((o) => (
          <li key={o.id}>
            <Link
              href={`/contacts/${o.contactId}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/40"
            >
              <Avatar name={contactDisplayName(o.contact)} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{contactDisplayName(o.contact)}</p>
                {o.contact?.email && <p className="truncate text-sm text-muted-foreground">{o.contact.email}</p>}
              </div>
              <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                <StatusPill tone={stageTone[o.stage]}>{stageLabel[o.stage]}</StatusPill>
                <StatusPill tone={dispositionTone[o.disposition]}>{dispositionLabel[o.disposition]}</StatusPill>
              </div>
              <div className="hidden w-40 shrink-0 truncate text-sm text-muted-foreground lg:block">
                {formatMatterTypes(o.contact?.matterType) || '—'}
              </div>
              <div className="w-24 shrink-0 text-right text-xs text-muted-foreground">{fmtDate(o.nextFollowUpAt)}</div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/* -------------------------------- Cards view ----------------------------- */
function CardsView({ rows }: { rows: Opportunity[] }) {
  if (rows.length === 0) return <EmptyState icon={Users} title="Nothing in this tab" />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((o) => (
        <Link
          key={o.id}
          href={`/contacts/${o.contactId}`}
          className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand/50"
        >
          <div className="flex items-start gap-3">
            <Avatar name={contactDisplayName(o.contact)} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{contactDisplayName(o.contact)}</p>
              {o.contact?.email && (
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" /> {o.contact.email}
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <StatusPill tone={stageTone[o.stage]}>{stageLabel[o.stage]}</StatusPill>
            <StatusPill tone={dispositionTone[o.disposition]}>{dispositionLabel[o.disposition]}</StatusPill>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatMatterTypes(o.contact?.matterType) || 'No matter type'}</span>
            {o.nextFollowUpAt && <span>Follow-up {fmtDate(o.nextFollowUpAt)}</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ------------------------------ Calendar view ---------------------------- */
function CalendarView({ rows }: { rows: Opportunity[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay = useMemo(() => {
    const map: Record<number, Opportunity[]> = {};
    for (const o of rows) {
      if (!o.nextFollowUpAt) continue;
      const d = new Date(o.nextFollowUpAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        (map[d.getDate()] ??= []).push(o);
      }
    }
    return map;
  }, [rows, year, month]);

  const scheduled = Object.values(byDay).reduce((n, a) => n + a.length, 0);
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const today = new Date();
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <SectionCard
      title={monthLabel}
      description={`${scheduled} follow-up${scheduled === 1 ? '' : 's'} scheduled this month`}
      action={
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="size-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Today</Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="size-4" /></Button>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => (
          <div
            key={i}
            className={cn(
              'min-h-20 rounded-lg border p-1.5 text-left',
              day ? 'border-border bg-background' : 'border-transparent',
            )}
          >
            {day && (
              <>
                <div className={cn('mb-1 text-xs font-medium', isToday(day) ? 'text-brand' : 'text-muted-foreground')}>
                  {isToday(day) ? <span className="rounded bg-brand px-1.5 py-0.5 text-brand-foreground">{day}</span> : day}
                </div>
                <div className="space-y-1">
                  {(byDay[day] ?? []).slice(0, 3).map((o) => (
                    <Link
                      key={o.id}
                      href={`/contacts/${o.contactId}`}
                      className="block truncate rounded bg-brand/15 px-1.5 py-0.5 text-[11px] font-medium text-brand hover:bg-brand/25"
                    >
                      {contactDisplayName(o.contact)}
                    </Link>
                  ))}
                  {(byDay[day]?.length ?? 0) > 3 && (
                    <p className="px-1 text-[10px] text-muted-foreground">+{(byDay[day]!.length - 3)} more</p>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Contacts appear on their next scheduled follow-up date. Set follow-up dates from a contact&apos;s page.</p>
    </SectionCard>
  );
}

/* ------------------------------- Kanban view ----------------------------- */
function KanbanView({ rows, onMove }: { rows: Opportunity[]; onMove: (id: string, stage: Stage) => void }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<Stage | null>(null);

  const active = rows.filter(
    (o) => o.disposition === 'active' || o.disposition === 're_engagement',
  );
  const recovery = rows.filter(
    (o) => o.disposition === 'dormant_no_response' || o.disposition === 'dormant_deferred' || o.disposition === 'exit',
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((stage) => {
          const cards = active.filter((o) => o.stage === stage);
          return (
            <div
              key={stage}
              onDragOver={(e) => { e.preventDefault(); setOverStage(stage); }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/opp-id');
                const from = e.dataTransfer.getData('text/opp-stage');
                if (id && from !== stage) onMove(id, stage);
                setDragId(null);
                setOverStage(null);
              }}
              className={cn(
                'rounded-xl border bg-card p-3 transition-colors',
                overStage === stage ? 'border-brand ring-1 ring-brand/40' : 'border-border',
              )}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <StatusPill tone={stageTone[stage]}>{stageLabel[stage]}</StatusPill>
                <span className="text-sm tabular-nums text-muted-foreground">{cards.length}</span>
              </div>
              <div className="space-y-2">
                {cards.length === 0 && <p className="px-1 py-4 text-xs text-muted-foreground">Drop here</p>}
                {cards.map((o) => (
                  <div
                    key={o.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/opp-id', o.id);
                      e.dataTransfer.setData('text/opp-stage', o.stage);
                      setDragId(o.id);
                    }}
                    onDragEnd={() => setDragId(null)}
                    className={cn(
                      'cursor-grab rounded-lg border border-border bg-background p-3 active:cursor-grabbing',
                      dragId === o.id && 'opacity-50',
                    )}
                  >
                    <Link href={`/contacts/${o.contactId}`} className="block">
                      <p className="truncate font-medium text-foreground hover:underline">{contactDisplayName(o.contact)}</p>
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {formatMatterTypes(o.contact?.matterType) || 'No matter type'}
                    </p>
                    {o.disposition === 're_engagement' && (
                      <span className="mt-2 inline-block"><StatusPill tone="warning">Re-engagement</StatusPill></span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="px-1 text-xs text-muted-foreground">Drag a card between columns to advance or move its stage.</p>

      {recovery.length > 0 && (
        <SectionCard title="Recovery & disposition" description="Dormant · Exit" bodyClassName="p-0">
          <TableWrap>
            <thead>
              <tr><Th>Contact</Th><Th>Last stage</Th><Th className="text-right">Disposition</Th></tr>
            </thead>
            <tbody>
              {recovery.map((o) => (
                <Tr key={o.id}>
                  <Td><Link href={`/contacts/${o.contactId}`} className="font-medium text-foreground hover:underline">{contactDisplayName(o.contact)}</Link></Td>
                  <Td><StatusPill tone={stageTone[o.stage]}>{stageLabel[o.stage]}</StatusPill></Td>
                  <Td className="text-right"><StatusPill tone={dispositionTone[o.disposition]}>{dispositionLabel[o.disposition]}</StatusPill></Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </SectionCard>
      )}
    </div>
  );
}

/* -------------------------------- shared --------------------------------- */
function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-secondary font-semibold text-muted-foreground',
        size === 'lg' ? 'size-10 text-sm' : 'size-8 text-xs',
      )}
    >
      {name[0]?.toUpperCase()}
    </span>
  );
}

/* ---------------------------------- Map ---------------------------------- */
function ContactsMap({ rows }: { rows: Opportunity[] }) {
  const router = useRouter();
  return (
    <SectionCard bodyClassName="p-3">
      <LazyMapView
        items={rows}
        getId={(o: Opportunity) => o.id}
        getTitle={(o: Opportunity) => contactDisplayName(o.contact)}
        getSubtitle={(o: Opportunity) => o.contact?.email ?? null}
        getAddress={(o: Opportunity) => contactAddress(o.contact)}
        onOpen={(o: Opportunity) => router.push(`/contacts/${o.contactId}`)}
      />
    </SectionCard>
  );
}
