import { StickyNote, Plus, Lock, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, StatTile, SectionCard, StatusPill } from "@/components/dashboard/page-parts";

export const metadata = { title: "Notes" };

const notes = [
  {
    client: "Eleanor V. Prescott",
    author: "J. Waters",
    time: "Today · 1:24 PM",
    billable: "0.4 hr",
    body: "Visited at Sunrise. Eleanor is settling in well; staff report good appetite and participation in activities. Reviewed medication list with charge nurse — no changes. Flagged annual accounting due 7/21; inventory reconciled through June.",
  },
  {
    client: "Harold Munro (Estate)",
    author: "M. Reyes",
    time: "Today · 10:02 AM",
    billable: "0.6 hr",
    body: "Call with attorney K. Liu re: distribution. Draft inventory & appraisement to be finalized by Friday. Confirmed appraisal received for the Glendale property. Heir S. Munro-Kelly requested timeline — will include in monthly update.",
  },
  {
    client: "Robert & Anne Delgado",
    author: "M. Reyes",
    time: "Yesterday · 4:47 PM",
    billable: "0.2 hr",
    body: "Low balance alert on POA operating account ($4,120). Pending Banner Health payment of $1,875. Recommend transfer from reserve before approving. Care plan review scheduled 8/14.",
  },
];

export default function NotesPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Practice"
        title="Case Notes"
        description="A timestamped, attributed record for every client — defensible in a court review."
        actions={
          <Button size="sm">
            <Plus className="size-4" /> New note
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Notes this week" value="58" icon={StickyNote} tone="brand" />
        <StatTile label="Billable hrs" value="14.2" icon={Clock} tone="good" />
        <StatTile label="Clients touched" value="29" icon={StickyNote} />
        <StatTile label="Locked (final)" value="212" icon={Lock} />
      </div>

      <div className="space-y-4">
        {notes.map((n, i) => (
          <SectionCard key={i}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold text-foreground">{n.client}</span>
              <StatusPill tone="good">{n.billable}</StatusPill>
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3" /> {n.author} · {n.time}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{n.body}</p>
          </SectionCard>
        ))}
      </div>
    </PageShell>
  );
}
