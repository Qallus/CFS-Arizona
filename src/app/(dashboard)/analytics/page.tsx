import { Users, Clock, DollarSign, CalendarCheck } from "lucide-react";
import { PageShell, PageHeader, StatTile, SectionCard } from "@/components/dashboard/page-parts";

export const metadata = { title: "Analytics" };

const billable = [
  { m: "Dec", v: 118 },
  { m: "Jan", v: 132 },
  { m: "Feb", v: 126 },
  { m: "Mar", v: 148 },
  { m: "Apr", v: 141 },
  { m: "May", v: 159 },
  { m: "Jun", v: 167 },
  { m: "Jul", v: 96, partial: true },
];
const maxV = Math.max(...billable.map((b) => b.v));

const composition = [
  { label: "Conservatorships", value: 11, pct: 32 },
  { label: "Trust administration", value: 9, pct: 26 },
  { label: "Powers of attorney", value: 8, pct: 23 },
  { label: "Estates", value: 4, pct: 12 },
  { label: "Guardianships", value: 2, pct: 7 },
];

export default function AnalyticsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Growth"
        title="Analytics"
        description="How the practice is running — caseload, billable time, and compliance performance."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Active caseload" value="34" icon={Users} tone="brand" hint="+3 this quarter" />
        <StatTile label="Billable hrs (mo)" value="167" icon={Clock} tone="good" />
        <StatTile label="Fees billed (YTD)" value="$142K" icon={DollarSign} />
        <StatTile label="Filed on time" value="100%" icon={CalendarCheck} tone="good" hint="Last 24 accountings" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Bar chart */}
        <div className="lg:col-span-3">
          <SectionCard title="Billable hours" description="Logged per month across all staff">
            <div className="flex h-56 items-end gap-2 sm:gap-3">
              {billable.map((b) => (
                <div key={b.m} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={`w-full rounded-t-md ${b.partial ? "bg-brand/40" : "bg-brand"}`}
                      style={{ height: `${(b.v / maxV) * 100}%` }}
                      title={`${b.v} hrs`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{b.m}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">July in progress (lighter bar).</p>
          </SectionCard>
        </div>

        {/* Composition */}
        <div className="lg:col-span-2">
          <SectionCard title="Caseload composition" description="By fiduciary role">
            <div className="space-y-4">
              {composition.map((c) => (
                <div key={c.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-foreground">{c.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {c.value} · {c.pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <SectionCard title="Compliance">
          <p className="text-3xl font-semibold tabular-nums text-emerald-500">100%</p>
          <p className="mt-1 text-sm text-muted-foreground">Accountings filed on or before the court deadline this year.</p>
        </SectionCard>
        <SectionCard title="Avg. time to file">
          <p className="text-3xl font-semibold tabular-nums text-foreground">18 days</p>
          <p className="mt-1 text-sm text-muted-foreground">From period close to accounting filed, down from 26 last year.</p>
        </SectionCard>
        <SectionCard title="Fee realization">
          <p className="text-3xl font-semibold tabular-nums text-foreground">92%</p>
          <p className="mt-1 text-sm text-muted-foreground">Of billed fiduciary fees approved and collected.</p>
        </SectionCard>
      </div>
    </PageShell>
  );
}
