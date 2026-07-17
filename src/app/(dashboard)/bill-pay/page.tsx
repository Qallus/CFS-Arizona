import { Wallet, Plus, TrendingUp, AlertTriangle, ArrowDownLeft, ArrowUpRight } from "lucide-react";
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

export const metadata = { title: "Bill Pay & Ledger" };

const queue = [
  { payee: "Sunrise Senior Living", client: "E. Prescott", amount: "$6,240.00", due: "Jul 20", account: "Conservatorship", low: false },
  { payee: "Banner Health", client: "Delgado", amount: "$1,875.00", due: "Jul 18", account: "POA operating", low: true },
  { payee: "Arizona Public Service", client: "Marion Estate", amount: "$318.44", due: "Jul 22", account: "Estate", low: false },
  { payee: "Maricopa County Treasurer", client: "Whitfield Trust", amount: "$3,406.10", due: "Jul 31", account: "Trust", low: false },
];

const ledger = [
  { date: "Jul 14", desc: "Deposit — Social Security", client: "E. Prescott", type: "in", amount: "$2,410.00" },
  { date: "Jul 12", desc: "Sunrise Senior Living — June", client: "E. Prescott", type: "out", amount: "$6,240.00" },
  { date: "Jul 11", desc: "Pharmacy — CVS", client: "Delgado", type: "out", amount: "$184.22" },
  { date: "Jul 10", desc: "Rental income — 4th St. duplex", client: "Whitfield Trust", type: "in", amount: "$3,150.00" },
  { date: "Jul 09", desc: "Property insurance", client: "Marion Estate", type: "out", amount: "$742.00" },
];

const balances = [
  { client: "Eleanor V. Prescott", account: "Conservatorship account", balance: "$48,910", low: false },
  { client: "Robert & Anne Delgado", account: "POA operating account", balance: "$4,120", low: true },
  { client: "Whitfield Family Trust", account: "Trust account", balance: "$61,540", low: false },
];

export default function BillPayPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Money"
        title="Bill Pay & Ledger"
        description="Client funds in and out — reconcilable to the penny, with every payment approved before it leaves."
        actions={
          <Button size="sm">
            <Plus className="size-4" /> Record transaction
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Funds under management" value="$1.24M" icon={Wallet} tone="brand" hint="Across 31 client accounts" />
        <StatTile label="Bills awaiting approval" value="7" icon={AlertTriangle} tone="critical" />
        <StatTile label="Paid this month" value="$84,220" icon={TrendingUp} tone="good" />
        <StatTile label="Low-balance alerts" value="1" icon={AlertTriangle} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionCard title="Bills awaiting approval" description="Nothing is paid until you approve it" bodyClassName="p-0">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Payee</Th>
                  <Th>Client / account</Th>
                  <Th>Due</Th>
                  <Th className="text-right">Amount</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {queue.map((q) => (
                  <Tr key={q.payee + q.client}>
                    <Td className="font-medium text-foreground">{q.payee}</Td>
                    <Td>
                      <span className="text-muted-foreground">{q.client}</span>
                      <span className="ml-1 text-xs text-muted-foreground">· {q.account}</span>
                      {q.low && <span className="ml-2 text-xs font-medium text-destructive">low balance</span>}
                    </Td>
                    <Td className="text-muted-foreground">{q.due}</Td>
                    <Td className="text-right font-medium tabular-nums text-foreground">{q.amount}</Td>
                    <Td className="text-right">
                      <Button size="xs" variant="outline">Approve</Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard title="Client balances" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {balances.map((b) => (
                <li key={b.client} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{b.client}</p>
                    <p className="truncate text-xs text-muted-foreground">{b.account}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium tabular-nums text-foreground">{b.balance}</p>
                    {b.low && <StatusPill tone="critical">Low</StatusPill>}
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>

      <div className="mt-4">
        <SectionCard title="Recent ledger activity" description="Combined trust-account register" bodyClassName="p-0">
          <TableWrap>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Description</Th>
                <Th>Client</Th>
                <Th className="text-right">Amount</Th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((l, i) => (
                <Tr key={i}>
                  <Td className="whitespace-nowrap text-muted-foreground">{l.date}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-2 font-medium text-foreground">
                      {l.type === "in" ? (
                        <ArrowDownLeft className="size-4 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="size-4 text-muted-foreground" />
                      )}
                      {l.desc}
                    </span>
                  </Td>
                  <Td className="text-muted-foreground">{l.client}</Td>
                  <Td className={`text-right font-medium tabular-nums ${l.type === "in" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                    {l.type === "in" ? "+" : "−"}
                    {l.amount.replace("$", "$")}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </SectionCard>
      </div>
    </PageShell>
  );
}
