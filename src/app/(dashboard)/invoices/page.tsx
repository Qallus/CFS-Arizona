import { Receipt, Plus, Clock, CheckCircle2, Gavel } from "lucide-react";
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

export const metadata = { title: "Invoices & Fees" };

const invoices = [
  { no: "INV-2026-118", client: "Eleanor V. Prescott", period: "Q2 2026", hours: "14.5 hrs", amount: "$2,102.50", status: "Awaiting court approval", tone: "warning" as const },
  { no: "INV-2026-117", client: "Whitfield Family Trust", period: "Jun 2026", hours: "6.0 hrs", amount: "$870.00", status: "Sent", tone: "info" as const },
  { no: "INV-2026-116", client: "Robert & Anne Delgado", period: "Jun 2026", hours: "9.25 hrs", amount: "$1,341.25", status: "Paid", tone: "good" as const },
  { no: "INV-2026-115", client: "Harold Munro (Estate)", period: "Q2 2026", hours: "22.0 hrs", amount: "$3,190.00", status: "Draft", tone: "neutral" as const },
  { no: "INV-2026-114", client: "Marion T. Alvarez", period: "Annual", hours: "31.5 hrs", amount: "$4,567.50", status: "Court-approved", tone: "good" as const },
];

export default function InvoicesPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Money"
        title="Invoices & Fees"
        description="Itemized fiduciary fee statements, built from logged time and ready for court review."
        actions={
          <Button size="sm">
            <Plus className="size-4" /> New statement
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Billed this quarter" value="$18,420" icon={Receipt} tone="brand" />
        <StatTile label="Awaiting court approval" value="4" icon={Gavel} tone="warning" />
        <StatTile label="Outstanding" value="$3,842" icon={Clock} />
        <StatTile label="Collected (mo)" value="$11,205" icon={CheckCircle2} tone="good" />
      </div>

      <SectionCard title="Fee statements" bodyClassName="p-0">
        <TableWrap>
          <thead>
            <tr>
              <Th>Statement</Th>
              <Th>Client</Th>
              <Th>Period</Th>
              <Th>Time</Th>
              <Th className="text-right">Amount</Th>
              <Th className="text-right">Status</Th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <Tr key={inv.no}>
                <Td>
                  <span className="font-mono text-xs font-medium text-foreground">{inv.no}</span>
                </Td>
                <Td className="font-medium text-foreground">{inv.client}</Td>
                <Td className="text-muted-foreground">{inv.period}</Td>
                <Td className="text-muted-foreground tabular-nums">{inv.hours}</Td>
                <Td className="text-right font-medium tabular-nums text-foreground">{inv.amount}</Td>
                <Td className="text-right">
                  <StatusPill tone={inv.tone}>{inv.status}</StatusPill>
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      </SectionCard>

      <p className="mt-3 text-xs text-muted-foreground">
        Fiduciary fees for court-supervised matters must be reasonable and are subject to court approval. Statements pull directly from time logged in Communications and Notes.
      </p>
    </PageShell>
  );
}
