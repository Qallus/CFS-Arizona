'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  Bell,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Search,
  Sun,
  Moon,
  User,
  PanelLeft,
  PanelLeftClose,
  LogOut,
  UserCog,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/ThemeProvider';
import { contactDisplayName } from '@/components/crm/crm-meta';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS, roleLabel, type Role } from '@/lib/rbac';

interface Note {
  id: string;
  type: string;
  label: string;
  sublabel: string;
  contactId: string;
  tone: string;
}
interface SearchHit {
  contactId: string;
  name: string;
  email: string | null;
}

export function Topbar({
  onMenu,
  collapsed,
  onToggleCollapse,
}: {
  onMenu: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const showBack = pathname !== '/';

  const [items, setItems] = useState<Note[]>([]);
  const [count, setCount] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const fetchNotes = async () => {
      try {
        const res = await fetch('/api/crm/notifications');
        const data = await res.json();
        if (!alive) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setCount(typeof data.count === 'number' ? data.count : 0);
      } catch {
        /* bell must never break the app */
      }
    };
    fetchNotes();
    const iv = setInterval(fetchNotes, 60000);
    const onFocus = () => fetchNotes();
    window.addEventListener('focus', onFocus);
    return () => {
      alive = false;
      clearInterval(iv);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (!bellOpen) return;
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [bellOpen]);

  const badge = count > 9 ? '9+' : String(count);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Collapse sidebar (desktop) */}
      <button
        onClick={onToggleCollapse}
        className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:flex"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
      </button>

      {/* Back */}
      {showBack && (
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title="Go back"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <GlobalSearch router={router} />

        <Link
          href="/messages"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title="Messages"
        >
          <MessageSquare className="size-5" />
        </Link>

        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={`Notifications (${count})`}
          >
            <Bell className="size-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white">
                {badge}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="font-semibold text-foreground">Notifications</span>
                <span className="text-xs text-muted-foreground">{count} to act on</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                    <CheckCircle2 className="size-8 text-emerald-500" />
                    <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {items.map((n) => (
                      <li key={n.id}>
                        <Link
                          href={`/contacts/${n.contactId}`}
                          onClick={() => setBellOpen(false)}
                          className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/50"
                        >
                          <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.tone === 'warning' ? 'bg-amber-500' : 'bg-brand')} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{n.label}</p>
                            <p className="truncate text-xs text-muted-foreground">{n.sublabel}</p>
                          </div>
                          <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle — to the right of the bell */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>

        <UserMenu />
      </div>
    </header>
  );
}

/* ---------------------- Account menu (top right) ---------------------- */
function UserMenu() {
  const { user, signOut, can } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Signing out is the one action that must work even when /api/me can't
  // resolve a profile — that is precisely when a user needs to get out.
  const label = user?.name || user?.email || 'Account';
  const initial = (user?.name || user?.email || 'U')[0]?.toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg p-1 pl-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        title={label}
      >
        {user?.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" className="size-8 rounded-full object-cover" />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-brand/20 text-xs font-semibold text-brand">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-40 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium text-foreground">{label}</p>
            {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
            {user?.role && (
              <p className="mt-1 text-[11px] font-medium text-brand">{roleLabel(user.role as Role)}</p>
            )}
          </div>

          <div className="py-1">
            <Link
              href="/account/profile"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/50"
            >
              <UserCog className="size-4 text-muted-foreground" />
              My profile
            </Link>

            {can(PERMISSIONS.USERS_VIEW) && (
              <Link
                href="/account/roles"
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/50"
              >
                <Users className="size-4 text-muted-foreground" />
                User management
              </Link>
            )}
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={async () => {
                setSigningOut(true);
                try {
                  await signOut();
                } finally {
                  setSigningOut(false);
                  setOpen(false);
                }
              }}
              disabled={signingOut}
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
            >
              <LogOut className="size-4 text-muted-foreground" />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------- Global contact search ---------------------- */
function GlobalSearch({ router }: { router: ReturnType<typeof useRouter> }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState<SearchHit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const ensureLoaded = useCallback(async () => {
    if (loaded) return;
    try {
      const res = await fetch('/api/crm/opportunities');
      const data = await res.json();
      const opps = Array.isArray(data.opportunities) ? data.opportunities : [];
      const hits: SearchHit[] = opps.map((o: { contactId: string; contact: unknown }) => ({
        contactId: o.contactId,
        name: contactDisplayName(o.contact as never),
        email: (o.contact as { email?: string | null })?.email ?? null,
      }));
      // De-dupe by contact.
      const seen = new Set<string>();
      setAll(hits.filter((h) => (seen.has(h.contactId) ? false : (seen.add(h.contactId), true))));
    } catch {
      /* ignore */
    } finally {
      setLoaded(true);
    }
  }, [loaded]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const q = query.trim().toLowerCase();
  const results = q
    ? all.filter((h) => h.name.toLowerCase().includes(q) || (h.email ?? '').toLowerCase().includes(q)).slice(0, 8)
    : [];

  const go = (contactId: string) => {
    setOpen(false);
    setQuery('');
    router.push(`/contacts/${contactId}`);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            ensureLoaded();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results.length) go(results[0].contactId);
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Search contacts…"
          className="h-9 w-40 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none transition-[width,box-shadow] focus-visible:w-56 focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-56 sm:focus-visible:w-72"
        />
      </div>

      {open && q.length > 0 && (
        <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {loaded ? 'No contacts match.' : 'Searching…'}
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-border overflow-y-auto">
              {results.map((h) => (
                <li key={h.contactId}>
                  <button
                    onClick={() => go(h.contactId)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-secondary/50"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                      {h.name[0]?.toUpperCase() ?? <User className="size-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{h.name}</p>
                      {h.email && <p className="truncate text-xs text-muted-foreground">{h.email}</p>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
