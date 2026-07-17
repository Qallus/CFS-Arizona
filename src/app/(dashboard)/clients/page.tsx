import { Users, Search, Plus, Landmark, Scale, HeartPulse, ScrollText } from "lucide-react";
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

export const metadata = { title: "Clients & Wards" };

const clients = [
  { name: "Eleanor V. Prescott", role: "Conservator", matter: "Conservatorship", status: "Active", supervised: true, staff: "J. Waters", due: "Accounting · 6 days", tone: "critical" as const },
  { name: "Harold Munro (Estate)", role: "Personal Rep.", matter: "Estate administration", status: "Active", supervised: true, staff: "M. Reyes", due: "Inventory · 12 days", tone: "warning" as const },
  { name: "Whitfield Family Trust", role: "Successor Trustee", matter: "Trust administration", status: "Active", supervised: false, staff: "J. Waters", due: "Review · 21 days", tone: "neutral" as const },
  { name: "Robert & Anne Delgado", role: "Agent (POA)", matter: "Financial & Healthcare POA", status: "Active", supervised: false, staff: "M. Reyes", due: "Care review · 28 days", tone: "neutral" as const },
  { name: "Marion T. Alvarez", role: "Guardian", matter: "Guardianship", status: "Active", supervised: true, staff: "J. Waters", due: "Annual report · 40 days", tone: "neutral" as const },
  { name: "Gloria Hensley", role: "Trustee", matter: "Special needs trust", status: "Onboarding", supervised: false, staff: "Unassigned", due: "Intake · scheduled", tone: "neutral" as const },
];

const roleIcon: Record<string, typeof Landmark> = {
  Conservator: Scale,
  "Personal Rep.": ScrollText,
  "Successor Trustee": Landmark,
  Trustee: Landmark,
  "Agent (POA)": HeartPulse,
  Guardian: Users,
};

export default function ClientsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Caseload"
        title="Clients & Wards"
        description="Every protected person and estate CFS is responsible for stewarding."
        actions={
          <>
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search clients…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
            <Button size="sm">
              <Plus className="size-4" /> Add client
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Total active" value="34" icon={Users} tone="brand" />
        <StatTile label="Court-supervised" value="18" icon={Scale} hint="Conservator / Guardian / PR" />
        <StatTile label="Trusts under admin" value="11" icon={Landmark} />
        <StatTile label="Onboarding" value="2" icon={Plus} tone="warning" />
      </div>

      <SectionCard bodyClassName="p-0">
        <TableWrap>
          <thead>
            <tr>
              <Th>Client / Ward</Th>
              <Th>Fiduciary role</Th>
              <Th>Matter</Th>
              <Th>Assigned</Th>
              <Th>Next deadline</Th>
              <Th className="text-right">Status</Th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const Icon = roleIcon[c.role] ?? Users;
              return (
                <Tr key={c.name}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                        <Icon className="size-4" />
                      </span>
                      <span className="font-medium text-foreground">{c.name}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-foreground">{c.role}</span>
                    {c.supervised && <span className="ml-2 text-xs text-muted-foreground">· court</span>}
                  </Td>
                  <Td className="text-muted-foreground">{c.matter}</Td>
                  <Td className="text-muted-foreground">{c.staff}</Td>
                  <Td>
                    <StatusPill tone={c.tone}>{c.due}</StatusPill>
                  </Td>
                  <Td className="text-right">
                    <StatusPill tone={c.status === "Active" ? "good" : "info"}>{c.status}</StatusPill>
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
