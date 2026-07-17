import { FileText, Upload, ScrollText, Gavel, FileBarChart, Mail, Shield } from "lucide-react";
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

export const metadata = { title: "Documents" };

const docs = [
  { name: "Prescott — Letters of Conservatorship.pdf", client: "E. Prescott", type: "Court order", updated: "Jul 12", by: "J. Waters", icon: Gavel },
  { name: "Whitfield Family Trust — Restatement.pdf", client: "Whitfield Trust", type: "Trust", updated: "Jul 09", by: "K. Liu, Esq.", icon: ScrollText },
  { name: "Munro — Inventory & Appraisement (draft).xlsx", client: "Munro Estate", type: "Accounting", updated: "Jul 08", by: "M. Reyes", icon: FileBarChart },
  { name: "Delgado — Durable POA (financial).pdf", client: "Delgado", type: "POA", updated: "Jun 30", by: "J. Waters", icon: Shield },
  { name: "Alvarez — Physician's report.pdf", client: "M. Alvarez", type: "Medical", updated: "Jun 28", by: "Dr. Sandoval", icon: FileText },
  { name: "Prescott — Family update letter, June.docx", client: "E. Prescott", type: "Correspondence", updated: "Jun 25", by: "J. Waters", icon: Mail },
];

const typeTone: Record<string, "brand" | "info" | "warning" | "good" | "neutral"> = {
  "Court order": "warning",
  Trust: "brand",
  Accounting: "info",
  POA: "brand",
  Medical: "good",
  Correspondence: "neutral",
};

export default function DocumentsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Practice"
        title="Documents"
        description="Trusts, powers of attorney, court orders, and accountings — versioned and retained per client."
        actions={
          <Button size="sm">
            <Upload className="size-4" /> Upload
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Total documents" value="1,284" icon={FileText} tone="brand" />
        <StatTile label="Court orders" value="46" icon={Gavel} />
        <StatTile label="Trusts & POAs" value="92" icon={ScrollText} />
        <StatTile label="Added this month" value="38" icon={Upload} tone="good" />
      </div>

      <SectionCard title="Recent documents" bodyClassName="p-0">
        <TableWrap>
          <thead>
            <tr>
              <Th>Document</Th>
              <Th>Client</Th>
              <Th>Type</Th>
              <Th>Updated</Th>
              <Th className="text-right">Added by</Th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <Tr key={d.name}>
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                      <d.icon className="size-4" />
                    </span>
                    <span className="max-w-[22rem] truncate font-medium text-foreground">{d.name}</span>
                  </div>
                </Td>
                <Td className="text-muted-foreground">{d.client}</Td>
                <Td>
                  <StatusPill tone={typeTone[d.type] ?? "neutral"}>{d.type}</StatusPill>
                </Td>
                <Td className="text-muted-foreground">{d.updated}</Td>
                <Td className="text-right text-muted-foreground">{d.by}</Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      </SectionCard>
    </PageShell>
  );
}
