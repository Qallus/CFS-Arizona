import { FileBarChart, Plus, AlertTriangle, CheckCircle2, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/components/dashboard/page-parts";

export const metadata = { title: "Court Accountings" };

const accountings = [
  { client: "Eleanor V. Prescott", type: "Conservatorship — Annual Account", period: "Yr 3 · 2025–2026", due: "Jul 21, 2026", stage: "In preparation", tone: "critical" as const, days: "6 days" },
  { client: "Marion T. Alvarez", type: "Guardianship — Annual Report", period: "2025–2026", due: "Aug 24, 2026", stage: "Not started", tone: "warning" as const, days: "40 days" },
  { client: "Harold Munro (Estate)", type: "Estate — Inventory & Appraisement", period: "Initial", due: "Jul 27, 2026", stage: "In preparation", tone: "warning" as const, days: "12 days" },
  { client: "Cortez Conservatorship", type: "Conservatorship — Annual Account", period: "Yr 1 · 2025–2026", due: "Sep 30, 2026", stage: "Filed — awaiting order", tone: "info" as const, days: "77 days" },
  { client: "Estate of R. Fields", type: "Estate — Final Account", period: "Closing", due: "Jun 15, 2026", stage: "Approved", tone: "good" as const, days: "Filed" },
];

const stageIcon: Record<string, typeof Gavel> = {
  "In preparation": FileBarChart,
  "Not started": AlertTriangle,
  "Filed — awaiting order": Gavel,
  Approved: CheckCircle2,
};

export default function CourtAccountingsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Money"
        title="Court Accountings"
        description="The filing schedule for every court-supervised matter — the deadlines a fiduciary can't miss."
        actions={
          <Button size="sm">
            <Plus className="size-4" /> Start accounting
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Due within 30 days" value="3" icon={AlertTriangle} tone="critical" />
        <StatTile label="In preparation" value="5" icon={FileBarChart} tone="warning" />
        <StatTile label="Filed, awaiting order" value="2" icon={Gavel} tone="info" />
        <StatTile label="Approved this year" value="14" icon={CheckCircle2} tone="good" />
      </div>

      <SectionCard title="Accounting schedule" bodyClassName="p-0">
        <TableWrap>
          <thead>
            <tr>
              <Th>Client</Th>
              <Th>Filing</Th>
              <Th>Period</Th>
              <Th>Due</Th>
              <Th>Countdown</Th>
              <Th className="text-right">Stage</Th>
            </tr>
          </thead>
          <tbody>
            {accountings.map((a) => {
              const Icon = stageIcon[a.stage] ?? FileBarChart;
              return (
                <Tr key={a.client + a.type}>
                  <Td className="font-medium text-foreground">{a.client}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Icon className="size-3.5 opacity-70" /> {a.type}
                    </span>
                  </Td>
                  <Td className="text-muted-foreground">{a.period}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{a.due}</Td>
                  <Td>
                    <StatusPill tone={a.tone}>{a.days}</StatusPill>
                  </Td>
                  <Td className="text-right">
                    <span className="text-sm text-foreground">{a.stage}</span>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </TableWrap>
      </SectionCard>
    </PageShell>
  );
}
