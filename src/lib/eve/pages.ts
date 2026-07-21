/**
 * The dashboard, described for Eve.
 *
 * Eve answers questions about the app, so she needs to know what each page is
 * for. Crucially she also needs to know which pages are backed by live data and
 * which are still design mockups — without that she will confidently describe
 * placeholder numbers on the Matters page as though they were real matters.
 *
 * Keep `status` honest. When a page gets a real data layer, flip it to 'live'.
 */

export type PageStatus = 'live' | 'mockup';

export interface PageInfo {
  href: string;
  name: string;
  group: string;
  status: PageStatus;
  purpose: string;
}

export const DASHBOARD_PAGES: PageInfo[] = [
  { href: '/', name: 'Today', group: 'Overview', status: 'mockup', purpose: 'Landing dashboard with the day at a glance.' },

  // Caseload
  { href: '/contacts', name: 'Contacts', group: 'Caseload', status: 'live', purpose: 'The CRM funnel. People records plus an Opportunity per engagement, moving through Awareness → Interest → Intake → Nurture. Backed by sig_contacts and sig_opportunities.' },
  { href: '/clients', name: 'Clients & Wards', group: 'Caseload', status: 'mockup', purpose: 'Intended for people CFS serves as fiduciary. Currently a static mockup.' },
  { href: '/matters', name: 'Matters', group: 'Caseload', status: 'mockup', purpose: 'Intended as one file per engagement — trusts, estates, conservatorships, guardianships, POA. Currently a static mockup.' },
  { href: '/care-team', name: 'Care Team', group: 'Caseload', status: 'mockup', purpose: 'Intended for the providers around each client. Currently a static mockup.' },
  { href: '/care-plans', name: 'Care Plans', group: 'Caseload', status: 'mockup', purpose: 'Intended for the care plan of record per client. Currently a static mockup.' },

  // Money
  { href: '/bill-pay', name: 'Bill Pay & Ledger', group: 'Money', status: 'mockup', purpose: 'Intended as the trust ledger — client money in and out. Currently a static mockup; client money is still handled manually.' },
  { href: '/invoices', name: 'Invoices & Fees', group: 'Money', status: 'mockup', purpose: 'Intended for fiduciary fee billing. Currently a static mockup.' },
  { href: '/court-accountings', name: 'Court Accountings', group: 'Money', status: 'mockup', purpose: 'Intended for the periodic accountings filed with the court. Currently a static mockup.' },

  // Practice
  { href: '/calendar', name: 'Calendar & Deadlines', group: 'Practice', status: 'mockup', purpose: 'Court dates and filing deadlines.' },
  { href: '/documents', name: 'Documents', group: 'Practice', status: 'mockup', purpose: 'Intended as the document library. Currently a static mockup.' },
  { href: '/communications', name: 'Communications', group: 'Practice', status: 'mockup', purpose: 'Call and email history.' },
  { href: '/messages', name: 'Messages', group: 'Practice', status: 'live', purpose: 'Internal team messages, backed by sig_messages.' },
  { href: '/notes', name: 'Notes', group: 'Practice', status: 'mockup', purpose: 'Intended for practice notes. Currently a static mockup.' },
  { href: '/automations', name: 'Automations', group: 'Practice', status: 'mockup', purpose: 'Follow-up cadences and triggers.' },

  // Team
  { href: '/mileage', name: 'Mileage Log', group: 'Team', status: 'live', purpose: 'Staff mileage tracking, backed by sig_mileage_logs.' },
  { href: '/employee-docs', name: 'Employee Docs', group: 'Team', status: 'live', purpose: 'HR document tracking per employee, backed by sig_employee_documents.' },

  // Growth
  { href: '/referrals', name: 'Referrals', group: 'Growth', status: 'mockup', purpose: 'Referral sources feeding the funnel.' },
  { href: '/website', name: 'Website', group: 'Growth', status: 'mockup', purpose: 'Public site content.' },
  { href: '/analytics', name: 'Analytics', group: 'Growth', status: 'mockup', purpose: 'Practice metrics.' },

  // Account
  { href: '/account/profile', name: 'My Profile', group: 'Account', status: 'live', purpose: 'Your own profile — name, contact details, photo, timezone. Backed by /api/me.' },
  { href: '/account/roles', name: 'User Management', group: 'Account', status: 'live', purpose: 'Add, invite, edit, and archive users and their roles. Requires the users.view permission. Backed by /api/users.' },
];

/** Compact page list for the system prompt. */
export function pageDirectory(): string {
  const byGroup = new Map<string, PageInfo[]>();
  for (const p of DASHBOARD_PAGES) {
    const list = byGroup.get(p.group) ?? [];
    list.push(p);
    byGroup.set(p.group, list);
  }
  return [...byGroup.entries()]
    .map(
      ([group, pages]) =>
        `${group}:\n` +
        pages.map((p) => `  - ${p.name} (${p.href}) [${p.status}] — ${p.purpose}`).join('\n'),
    )
    .join('\n');
}

export function findPage(pathname: string): PageInfo | null {
  return (
    DASHBOARD_PAGES.find((p) => p.href === pathname) ??
    DASHBOARD_PAGES.find((p) => p.href !== '/' && pathname.startsWith(p.href)) ??
    null
  );
}
