'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Users,
  Contact,
  Landmark,
  HeartHandshake,
  ClipboardList,
  Wallet,
  Receipt,
  FileBarChart,
  CalendarClock,
  FileText,
  MessageSquare,
  Send,
  StickyNote,
  Zap,
  Share2,
  Globe,
  BarChart3,
  Car,
  ShieldCheck,
  Settings,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LighthouseLockup, LighthouseMark } from '@/components/branding/Lighthouse';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

type NavItem = { name: string; href: string; icon: typeof LayoutGrid; badge?: string };
type NavGroup = { label?: string; items: NavItem[] };

const navigation: NavGroup[] = [
  { items: [{ name: 'Today', href: '/', icon: LayoutGrid }] },
  {
    label: 'Caseload',
    items: [
      { name: 'Contacts', href: '/contacts', icon: Contact, badge: 'New' },
      { name: 'Clients & Wards', href: '/clients', icon: Users },
      { name: 'Matters', href: '/matters', icon: Landmark },
      { name: 'Care Team', href: '/care-team', icon: HeartHandshake },
      { name: 'Care Plans', href: '/care-plans', icon: ClipboardList, badge: 'New' },
    ],
  },
  {
    label: 'Money',
    items: [
      { name: 'Bill Pay & Ledger', href: '/bill-pay', icon: Wallet, badge: 'New' },
      { name: 'Invoices & Fees', href: '/invoices', icon: Receipt },
      { name: 'Court Accountings', href: '/court-accountings', icon: FileBarChart, badge: 'New' },
    ],
  },
  {
    label: 'Practice',
    items: [
      { name: 'Calendar & Deadlines', href: '/calendar', icon: CalendarClock },
      { name: 'Documents', href: '/documents', icon: FileText },
      { name: 'Communications', href: '/communications', icon: MessageSquare },
      { name: 'Messages', href: '/messages', icon: Send },
      { name: 'Notes', href: '/notes', icon: StickyNote },
      { name: 'Automations', href: '/automations', icon: Zap },
    ],
  },
  {
    label: 'Team',
    items: [
      { name: 'Mileage Log', href: '/mileage', icon: Car, badge: 'New' },
      { name: 'Employee Docs', href: '/employee-docs', icon: ShieldCheck, badge: 'New' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { name: 'Referrals', href: '/referrals', icon: Share2 },
      { name: 'Website', href: '/website', icon: Globe },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
];

interface SidebarProps {
  status?: 'working' | 'thinking' | 'sleeping';
  collapsed?: boolean;
  onClose?: () => void;
}

export function Sidebar({ collapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  // A nav row; wrapped in a right-side tooltip when collapsed (desktop only).
  const NavRow = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    const link = (
      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          collapsed && 'lg:justify-center lg:gap-0 lg:px-2',
          active ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
        )}
      >
        <item.icon className={cn('size-[18px] shrink-0', active ? 'opacity-100' : 'opacity-80')} />
        <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.name}</span>
        {item.badge && (
          <span
            className={cn(
              'ml-auto rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
              collapsed && 'lg:hidden',
              active ? 'bg-brand-foreground/15 text-brand-foreground' : 'border border-brass/60 text-brass',
            )}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
    if (!collapsed) return link;
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="hidden lg:block">
          {item.name}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'flex h-full flex-col border-r border-border bg-card transition-[width] duration-200',
          collapsed ? 'w-64 lg:w-16' : 'w-64',
        )}
      >
        {/* Header */}
        <div className={cn('flex items-center justify-between border-b border-border px-3 py-4', collapsed && 'lg:justify-center lg:px-2')}>
          <Link href="/" onClick={onClose} className="flex min-w-0 items-center pl-1">
            {collapsed ? (
              <>
                <LighthouseMark className="hidden h-10 lg:inline-block" />
                <LighthouseLockup mark={40} className="lg:hidden" />
              </>
            ) : (
              <LighthouseLockup mark={40} />
            )}
          </Link>
          {onClose && (
            <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-secondary lg:hidden" aria-label="Close menu">
              <X className="size-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navigation.map((group, gi) => (
            <div key={group.label ?? gi} className="space-y-1">
              {group.label && (
                <p
                  className={cn(
                    'px-3 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70',
                    collapsed && 'lg:hidden',
                  )}
                >
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <NavRow key={item.name} item={item} />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="space-y-2 border-t border-border p-3">
          {/* Settings */}
          {(() => {
            const active = isActive('/settings');
            const link = (
              <Link
                href="/settings"
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  collapsed && 'lg:justify-center lg:gap-0 lg:px-2',
                  active ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                )}
              >
                <Settings className="size-[18px] shrink-0" />
                <span className={cn(collapsed && 'lg:hidden')}>Settings</span>
              </Link>
            );
            return collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" className="hidden lg:block">Settings</TooltipContent>
              </Tooltip>
            ) : (
              link
            );
          })()}

          {user && (
            <div className={cn('flex items-center gap-2', collapsed ? 'lg:justify-center' : 'justify-between')}>
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-brand/20 text-xs font-semibold text-brand">
                  {(user.name || user.email)?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className={cn('min-w-0 leading-tight', collapsed && 'lg:hidden')}>
                  <p className="truncate text-xs font-medium text-foreground">{user.name || 'Team member'}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className={cn('rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive', collapsed && 'lg:hidden')}
                title="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          )}

          <p className={cn('px-1 text-[11px] text-muted-foreground', collapsed && 'lg:text-center')}>
            {collapsed ? <span className="lg:hidden">Steward v0.1</span> : 'Steward v0.1'}
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
