import { ClipboardList, Plus, CalendarClock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, StatTile, SectionCard, StatusPill } from "@/components/dashboard/page-parts";

export const metadata = { title: "Care Plans" };

const plans = [
  { client: "Eleanor V. Prescott", focus: "Assisted living transition & medication oversight", progress: 82, tasks: "9 of 11 tasks", review: "Review in 6 days", tone: "warning" as const },
  { client: "Robert & Anne Delgado", focus: "In-home care coordination, dual POA", progress: 60, tasks: "6 of 10 tasks", review: "Review in 28 days", tone: "neutral" as const },
  { client: "Marion T. Alvarez", focus: "Memory care placement & guardianship duties", progress: 45, tasks: "5 of 11 tasks", review: "Review in 12 days", tone: "warning" as const },
  { client: "Gloria Hensley", focus: "Special-needs support & benefit preservation", progress: 20, tasks: "2 of 10 tasks", review: "Intake scheduled", tone: "neutral" as const },
];

function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full rounded-full bg-brand transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function CarePlansPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Caseload"
        title="Care Plans"
        description="Living plans for each client's wellbeing — tasks, milestones, and review cadence."
        actions={
          <Button size="sm">
            <Plus className="size-4" /> New care plan
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Active plans" value="27" icon={ClipboardList} tone="brand" />
        <StatTile label="Reviews due (30d)" value="9" icon={CalendarClock} tone="warning" />
        <StatTile label="Tasks completed (mo)" value="64" icon={CheckCircle2} tone="good" />
        <StatTile label="Avg. completion" value="61%" icon={ClipboardList} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((p) => (
          <SectionCard key={p.client}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{p.client}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{p.focus}</p>
              </div>
              <StatusPill tone={p.tone}>{p.review}</StatusPill>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Progress value={p.progress} />
              <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">{p.progress}%</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{p.tasks}</p>
          </SectionCard>
        ))}
      </div>
    </PageShell>
  );
}
