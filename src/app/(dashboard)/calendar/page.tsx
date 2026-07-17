import { CalendarClock, Plus, Gavel, Users, HeartPulse, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, StatTile, SectionCard, StatusPill, Dot } from "@/components/dashboard/page-parts";

export const metadata = { title: "Calendar & Deadlines" };

type Kind = "court" | "care" | "review" | "meeting";
const kindMeta: Record<Kind, { icon: typeof Gavel; label: string }> = {
  court: { icon: Gavel, label: "Court filing" },
  care: { icon: HeartPulse, label: "Care visit" },
  review: { icon: FileBarChart, label: "Review" },
  meeting: { icon: Users, label: "Meeting" },
};

const months = [
  {
    month: "July 2026",
    events: [
      { day: "Thu 18", title: "Banner Health payment — Delgado", kind: "care" as Kind, tone: "warning" as const },
      { day: "Sat 20", title: "Sunrise Senior Living — monthly", kind: "care" as Kind, tone: "neutral" as const },
      { day: "Sun 21", title: "Prescott conservatorship annual accounting DUE", kind: "court" as Kind, tone: "critical" as const },
      { day: "Wed 24", title: "Care conference — Dr. Sandoval", kind: "meeting" as Kind, tone: "neutral" as const },
      { day: "Sat 27", title: "Munro estate inventory & appraisement DUE", kind: "court" as Kind, tone: "warning" as const },
    ],
  },
  {
    month: "August 2026",
    events: [
      { day: "Mon 03", title: "Whitfield trust annual review", kind: "review" as Kind, tone: "neutral" as const },
      { day: "Fri 14", title: "Delgado care plan review meeting", kind: "meeting" as Kind, tone: "neutral" as const },
      { day: "Mon 24", title: "Alvarez guardianship annual report DUE", kind: "court" as Kind, tone: "warning" as const },
    ],
  },
];

export default function CalendarPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Practice"
        title="Calendar & Deadlines"
        description="Court dates, care visits, and reviews across the whole caseload in one timeline."
        actions={
          <Button size="sm">
            <Plus className="size-4" /> Add event
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="This week" value="4" icon={CalendarClock} tone="warning" />
        <StatTile label="Court filings (30d)" value="3" icon={Gavel} tone="critical" />
        <StatTile label="Care visits (30d)" value="19" icon={HeartPulse} />
        <StatTile label="Reviews (30d)" value="6" icon={FileBarChart} />
      </div>

      <div className="space-y-6">
        {months.map((m) => (
          <SectionCard key={m.month} title={m.month} bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {m.events.map((e) => {
                const Icon = kindMeta[e.kind].icon;
                return (
                  <li key={e.title} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-16 shrink-0 text-sm font-medium text-muted-foreground">{e.day}</div>
                    <Dot tone={e.tone} />
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{kindMeta[e.kind].label}</p>
                    </div>
                    {e.tone === "critical" && <StatusPill tone="critical">Due</StatusPill>}
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        ))}
      </div>
    </PageShell>
  );
}
