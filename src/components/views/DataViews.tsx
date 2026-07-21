'use client';

/**
 * Five ways to look at one list: List, Table, Kanban, Card, Calendar.
 *
 * Generic over the record type via a ViewConfig descriptor, so a page supplies
 * its fields and grouping rather than its own copy of these views. Built for
 * Matters first; the remaining dashboard pages reuse it by writing a config.
 */
import { useMemo, useState, type ReactNode } from 'react';
import {
  List as ListIcon,
  Table as TableIcon,
  Columns3,
  LayoutGrid,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  StatusPill,
  TableWrap,
  Th,
  Td,
  Tr,
  EmptyState,
  type Tone,
} from '@/components/dashboard/page-parts';

export const VIEW_MODES = ['list', 'table', 'kanban', 'card', 'calendar'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

const VIEW_META: Record<ViewMode, { label: string; icon: typeof ListIcon }> = {
  list: { label: 'List', icon: ListIcon },
  table: { label: 'Table', icon: TableIcon },
  kanban: { label: 'Kanban', icon: Columns3 },
  card: { label: 'Card', icon: LayoutGrid },
  calendar: { label: 'Calendar', icon: CalendarDays },
};

export interface ViewColumn {
  key: string;
  label: string;
  tone?: Tone;
}

export interface ViewField<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  className?: string;
}

export interface ViewConfig<T> {
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  getSubtitle?: (item: T) => ReactNode;
  getMeta?: (item: T) => ReactNode;
  getBadge?: (item: T) => { label: string; tone: Tone } | null;
  /** Kanban columns, in order. */
  columns: ViewColumn[];
  getColumnKey: (item: T) => string;
  /** ISO date used to place the record on the calendar. */
  getDate?: (item: T) => string | null;
  /** Table columns. */
  fields: ViewField<T>[];
  isFavorite?: (item: T) => boolean;
  isArchived?: (item: T) => boolean;
}

export interface DataViewsProps<T> {
  mode: ViewMode;
  items: T[];
  config: ViewConfig<T>;
  onOpen?: (item: T) => void;
  /** Rendered in each row/card — the per-item action menu. */
  renderActions?: (item: T) => ReactNode;
  /** Enables kanban drag-and-drop when supplied. */
  onColumnChange?: (item: T, columnKey: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

/* ----------------------------- View switcher ----------------------------- */

export function ViewSwitcher({
  mode,
  onChange,
  available = VIEW_MODES,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
  available?: readonly ViewMode[];
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-secondary/50 p-0.5">
      {available.map((m) => {
        const { label, icon: Icon } = VIEW_META[m];
        const active = m === mode;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            aria-pressed={active}
            title={`${label} view`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------- Shared --------------------------------- */

function FavoriteMark({ on }: { on?: boolean }) {
  if (!on) return null;
  return <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Favorite" />;
}

function ArchivedMark({ on }: { on?: boolean }) {
  if (!on) return null;
  return <StatusPill tone="neutral">Archived</StatusPill>;
}

function parseLocalDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/* --------------------------------- Router -------------------------------- */

export function DataViews<T>(props: DataViewsProps<T>) {
  const { mode, items, emptyTitle = 'Nothing here yet', emptyDescription } = props;

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  if (mode === 'table') return <TableView {...props} />;
  if (mode === 'kanban') return <KanbanView {...props} />;
  if (mode === 'card') return <CardView {...props} />;
  if (mode === 'calendar') return <CalendarView {...props} />;
  return <ListView {...props} />;
}

/* --------------------------------- List ---------------------------------- */

function ListView<T>({ items, config, onOpen, renderActions }: DataViewsProps<T>) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {items.map((item) => {
        const badge = config.getBadge?.(item);
        return (
          <li
            key={config.getId(item)}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/40"
          >
            <button
              type="button"
              onClick={() => onOpen?.(item)}
              className="min-w-0 flex-1 text-left"
            >
              <div className="flex items-center gap-2">
                <FavoriteMark on={config.isFavorite?.(item)} />
                <span className="truncate font-medium text-foreground">{config.getTitle(item)}</span>
                <ArchivedMark on={config.isArchived?.(item)} />
              </div>
              {config.getSubtitle && (
                <p className="truncate text-sm text-muted-foreground">{config.getSubtitle(item)}</p>
              )}
            </button>
            {config.getMeta && (
              <div className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                {config.getMeta(item)}
              </div>
            )}
            {badge && <StatusPill tone={badge.tone}>{badge.label}</StatusPill>}
            {renderActions?.(item)}
          </li>
        );
      })}
    </ul>
  );
}

/* --------------------------------- Table --------------------------------- */

function TableView<T>({ items, config, onOpen, renderActions }: DataViewsProps<T>) {
  return (
    <TableWrap>
      <thead>
        <tr>
          <Th>Name</Th>
          {config.fields.map((f) => (
            <Th key={f.key} className={f.className}>
              {f.label}
            </Th>
          ))}
          {renderActions && <Th className="w-10" />}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <Tr key={config.getId(item)}>
            <Td>
              <button
                type="button"
                onClick={() => onOpen?.(item)}
                className="flex items-center gap-2 text-left font-medium text-foreground hover:text-brand"
              >
                <FavoriteMark on={config.isFavorite?.(item)} />
                {config.getTitle(item)}
              </button>
            </Td>
            {config.fields.map((f) => (
              <Td key={f.key} className={f.className}>
                {f.render(item)}
              </Td>
            ))}
            {renderActions && <Td>{renderActions(item)}</Td>}
          </Tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

/* -------------------------------- Kanban --------------------------------- */

function KanbanView<T>({
  items,
  config,
  onOpen,
  renderActions,
  onColumnChange,
}: DataViewsProps<T>) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, T[]>();
    for (const col of config.columns) map.set(col.key, []);
    for (const item of items) {
      const key = config.getColumnKey(item);
      // A record whose column is not in the config still has to appear
      // somewhere, or it silently vanishes from the board.
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [items, config]);

  const columns = [
    ...config.columns,
    ...[...grouped.keys()]
      .filter((k) => !config.columns.some((c) => c.key === k))
      .map((k) => ({ key: k, label: k, tone: 'neutral' as Tone })),
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map((col) => {
        const colItems = grouped.get(col.key) ?? [];
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              if (!onColumnChange || !dragId) return;
              e.preventDefault();
              setOverColumn(col.key);
            }}
            onDragLeave={() => setOverColumn((c) => (c === col.key ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              setOverColumn(null);
              if (!onColumnChange || !dragId) return;
              const item = items.find((i) => config.getId(i) === dragId);
              if (item && config.getColumnKey(item) !== col.key) onColumnChange(item, col.key);
              setDragId(null);
            }}
            className={cn(
              'flex w-72 shrink-0 flex-col rounded-lg border border-border bg-secondary/30 transition-colors',
              overColumn === col.key && 'border-brand bg-brand/5',
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <span className="text-sm font-semibold text-foreground">{col.label}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                {colItems.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-2">
              {colItems.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">Empty</p>
              ) : (
                colItems.map((item) => (
                  <div
                    key={config.getId(item)}
                    draggable={Boolean(onColumnChange)}
                    onDragStart={() => setDragId(config.getId(item))}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverColumn(null);
                    }}
                    className={cn(
                      'rounded-lg border border-border bg-card p-3 shadow-sm transition-opacity',
                      onColumnChange && 'cursor-grab active:cursor-grabbing',
                      dragId === config.getId(item) && 'opacity-50',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => onOpen?.(item)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-1.5">
                          <FavoriteMark on={config.isFavorite?.(item)} />
                          <span className="truncate text-sm font-medium text-foreground">
                            {config.getTitle(item)}
                          </span>
                        </div>
                        {config.getSubtitle && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {config.getSubtitle(item)}
                          </p>
                        )}
                      </button>
                      {renderActions?.(item)}
                    </div>
                    {config.getMeta && (
                      <p className="mt-2 text-xs text-muted-foreground">{config.getMeta(item)}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- Card ---------------------------------- */

function CardView<T>({ items, config, onOpen, renderActions }: DataViewsProps<T>) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const badge = config.getBadge?.(item);
        return (
          <div
            key={config.getId(item)}
            className="flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand/40"
          >
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => onOpen?.(item)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-1.5">
                  <FavoriteMark on={config.isFavorite?.(item)} />
                  <span className="truncate font-semibold text-foreground">
                    {config.getTitle(item)}
                  </span>
                </div>
                {config.getSubtitle && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {config.getSubtitle(item)}
                  </p>
                )}
              </button>
              {renderActions?.(item)}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {badge && <StatusPill tone={badge.tone}>{badge.label}</StatusPill>}
              <ArchivedMark on={config.isArchived?.(item)} />
            </div>

            {config.getMeta && (
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                {config.getMeta(item)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- Calendar -------------------------------- */

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function CalendarView<T>({ items, config, onOpen }: DataViewsProps<T>) {
  const [view, setView] = useState(() => new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, T[]>();
    if (!config.getDate) return map;
    for (const item of items) {
      const raw = config.getDate(item);
      if (!raw) continue;
      const d = parseLocalDate(raw);
      if (!d) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [items, config]);

  if (!config.getDate) {
    return <EmptyState title="No date field" description="This list has no dates to place on a calendar." />;
  }

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Records with no date would otherwise be invisible in this view.
  const undated = items.filter((i) => !config.getDate?.(i)).length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="font-semibold text-foreground">
          {view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-secondary/60 py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}

        {cells.map((day, i) => {
          const dayItems = day ? (byDay.get(`${year}-${month}-${day}`) ?? []) : [];
          const isToday =
            day &&
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;

          return (
            <div key={i} className="min-h-24 bg-card p-1.5">
              {day && (
                <>
                  <span
                    className={cn(
                      'inline-grid size-6 place-items-center rounded-full text-xs',
                      isToday ? 'bg-brand font-semibold text-brand-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayItems.slice(0, 3).map((item) => {
                      const badge = config.getBadge?.(item);
                      return (
                        <button
                          key={config.getId(item)}
                          type="button"
                          onClick={() => onOpen?.(item)}
                          title={config.getTitle(item)}
                          className={cn(
                            'block w-full truncate rounded px-1.5 py-1 text-left text-[11px] font-medium transition-colors',
                            badge?.tone === 'critical'
                              ? 'bg-destructive/15 text-destructive hover:bg-destructive/25'
                              : badge?.tone === 'warning'
                                ? 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400'
                                : 'bg-brand/15 text-brand hover:bg-brand/25',
                          )}
                        >
                          {config.getTitle(item)}
                        </button>
                      );
                    })}
                    {dayItems.length > 3 && (
                      <span className="block px-1.5 text-[11px] text-muted-foreground">
                        +{dayItems.length - 3} more
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {undated > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {undated} {undated === 1 ? 'record has' : 'records have'} no date and {undated === 1 ? 'is' : 'are'} not
          shown on this calendar.
        </p>
      )}
    </div>
  );
}
