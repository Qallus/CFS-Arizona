import Link from "next/link";
import {
  Users,
  Landmark,
  CalendarClock,
  Wallet,
  AlertTriangle,
  Clock,
  Phone,
  Share2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageShell,
  StatTile,
  SectionCard,
  StatusPill,
  Dot,
} from "@/components/dashboard/page-parts";

export const metadata = { title: "Today" };

/* ------------------------------- mock data ------------------------------- */

const deadlines = [
  { client: "Eleanor V. Prescott", task: "Annual accounting — Conservatorship", due: "in 6 days", tone: "critical" as const, meta: "Maricopa County · PB2023-0891" },
  { client: "Estate of Harold Munro", task: "Inventory & appraisement due", due: "in 12 days", tone: "warning" as const, meta: "Estate administration" },
  { client: "The Whitfield Family Trust", task: "Annual trust review & statement", due: "in 21 days", tone: "warning" as const, meta: "Successor trustee" },
  { client: "Robert & Anne Delgado", task: "Care plan review meeting", due: "in 28 days", tone: "neutral" as const, meta: "POA — financial & healthcare" },
];

const bills = [
  { client: "Eleanor V. Prescott", payee: "Sunrise Senior Living", amount: "$6,240.00", balance: "$48,910", low: false },
  { client: "Marion Estate", payee: "Arizona Public Service", amount: "$318.44", balance: "$12,205", low: false },
  { client: "Robert & Anne Delgado", payee: "Banner Health — statement", amount: "$1,875.00", balance: "$4,120", low: true },
  { client: "Whitfield Trust", payee: "Property tax — 2nd half", amount: "$3,406.10", balance: "$61,540", low: false },
];

const followUps = [
  { who: "Attorney — Karen Liu, Esq.", note: "Return call re: Munro estate distribution", when: "2h overdue", tone: "critical" as const },
  { who: "Family — David Prescott", note: "Monthly update call for his mother", when: "Due today", tone: "warning" as const },
  { who: "Dr. Sandoval's office", note: "Confirm care conference date", when: "Tomorrow", tone: "neutral" as const },
];

const referrals = [
  { name: "Referral — St. Joseph's discharge planning", type: "Guardianship inquiry", when: "3h ago" },
  { name: "Website — Free consultation request", type: "Trust administration", when: "Yesterday" },
];

/* --------------------------------- page ---------------------------------- */

export default function TodayPage() {
  return (
    <PageShell>
      {/* Greeting */}
      <div className="mb-6 sm:mb-8">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-brand">
          Wednesday · July 15
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Good afternoon
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Here&apos;s what needs your attention across the practice today.
        </p>
      </div>

      {/* Stat row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Active clients & wards" value="34" icon={Users} tone="brand" href="/clients" />
        <StatTile label="Open matters" value="41" icon={Landmark} hint="8 in court supervision" href="/matters" />
        <StatTile label="Deadlines this week" value="3" icon={CalendarClock} tone="warning" hint="1 within 7 days" href="/calendar" />
        <StatTile label="Bills awaiting approval" value="7" icon={Wallet} tone="critical" hint="1 low-balance account" href="/bill-pay" />
      </div>

      {/* Two-column: deadlines + bills */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Deadlines at the top"
          description="Court reports and reviews, ranked by urgency"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/calendar">
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {deadlines.map((d) => (
              <li key={d.client} className="flex items-start gap-3 px-5 py-3.5">
                <span className="mt-1.5">
                  <Dot tone={d.tone} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{d.task}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {d.client} · {d.meta}
                  </p>
                </div>
                <StatusPill tone={d.tone}>
                  {d.tone === "critical" && <AlertTriangle className="size-3" />}
                  {d.due}
                </StatusPill>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Bills awaiting approval"
          description="Queued for pay from client trust accounts"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/bill-pay">
                Open ledger <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {bills.map((b) => (
              <li key={b.client + b.payee} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{b.payee}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {b.client} · balance {b.balance}
                    {b.low && (
                      <span className="ml-2 font-medium text-destructive">low balance</span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 font-medium tabular-nums text-foreground">{b.amount}</span>
                <Button size="xs" variant="outline" className="shrink-0">
                  Approve
                </Button>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {/* Two-column: follow-ups + referrals */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Follow-ups owed" description="Log contact as billable time before it slips" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {followUps.map((f) => (
              <li key={f.who} className="flex items-start gap-3 px-5 py-3.5">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                  {f.who.startsWith("Attorney") ? (
                    <Landmark className="size-4" />
                  ) : f.who.startsWith("Family") ? (
                    <Phone className="size-4" />
                  ) : (
                    <Clock className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{f.note}</p>
                  <p className="truncate text-sm text-muted-foreground">{f.who}</p>
                </div>
                <StatusPill tone={f.tone}>{f.when}</StatusPill>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="New referrals"
          description="Intake requests waiting to be triaged"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/referrals">
                All referrals <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {referrals.map((r) => (
              <li key={r.name} className="flex items-start gap-3 px-5 py-3.5">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
                  <Share2 className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{r.type}</p>
                  <p className="truncate text-sm text-muted-foreground">{r.name}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{r.when}</span>
              </li>
            ))}
            <li className="flex items-center gap-2 px-5 py-3.5 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-500" />
              You&apos;re caught up on older referrals.
            </li>
          </ul>
        </SectionCard>
      </div>
    </PageShell>
  );
}
