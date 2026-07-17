import { Landmark, Plus, Scale, ScrollText, HeartPulse, Users } from "lucide-react";
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

export const metadata = { title: "Matters" };

const matters = [
  { ref: "PB2023-0891", client: "Eleanor V. Prescott", type: "Conservatorship", venue: "Maricopa County", opened: "Mar 2023", status: "Court supervision", tone: "info" as const },
  { ref: "PB2024-0142", client: "Harold Munro", type: "Estate administration", venue: "Maricopa County", opened: "Jan 2024", status: "Active", tone: "good" as const },
  { ref: "TR-0087", client: "Whitfield Family Trust", type: "Trust administration", venue: "Private", opened: "Nov 2022", status: "Active", tone: "good" as const },
  { ref: "POA-0231", client: "Robert & Anne Delgado", type: "Power of attorney", venue: "Private", opened: "Aug 2023", status: "Active", tone: "good" as const },
  { ref: "PB2022-1120", client: "Marion T. Alvarez", type: "Guardianship", venue: "Pinal County", opened: "Jun 2022", status: "Court supervision", tone: "info" as const },
  { ref: "TR-0104", client: "Gloria Hensley", type: "Special needs trust", venue: "Private", opened: "Jul 2026", status: "Onboarding", tone: "warning" as const },
];

export default function MattersPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Caseload"
        title="Matters"
        description="Each engagement CFS manages — trusts, estates, and court-appointed roles — as its own file."
        actions={
          <Button size="sm">
            <Plus className="size-4" /> Open matter
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Open matters" value="41" icon={Landmark} tone="brand" />
        <StatTile label="Court-supervised" value="8" icon={Scale} hint="Reporting to the court" tone="warning" />
        <StatTile label="Estates in admin" value="6" icon={ScrollText} />
        <StatTile label="POA engagements" value="9" icon={HeartPulse} />
      </div>

      <SectionCard title="All matters" bodyClassName="p-0">
        <TableWrap>
          <thead>
            <tr>
              <Th>Reference</Th>
              <Th>Client</Th>
              <Th>Type</Th>
              <Th>Venue</Th>
              <Th>Opened</Th>
              <Th className="text-right">Status</Th>
            </tr>
          </thead>
          <tbody>
            {matters.map((m) => (
              <Tr key={m.ref}>
                <Td>
                  <span className="font-mono text-xs font-medium text-foreground">{m.ref}</span>
                </Td>
                <Td className="font-medium text-foreground">{m.client}</Td>
                <Td>
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Users className="size-3.5 opacity-70" /> {m.type}
                  </span>
                </Td>
                <Td className="text-muted-foreground">{m.venue}</Td>
                <Td className="text-muted-foreground">{m.opened}</Td>
                <Td className="text-right">
                  <StatusPill tone={m.tone}>{m.status}</StatusPill>
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      </SectionCard>
    </PageShell>
  );
}
