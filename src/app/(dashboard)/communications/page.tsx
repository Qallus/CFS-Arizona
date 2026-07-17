import { Phone, PhoneOutgoing, PhoneIncoming, MessageSquare, Mail, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, StatTile, SectionCard, StatusPill } from "@/components/dashboard/page-parts";

export const metadata = { title: "Communications" };

type Ch = "call-out" | "call-in" | "sms" | "email";
const chMeta: Record<Ch, { icon: typeof Phone; tone: "brand" | "info" | "good" | "neutral" }> = {
  "call-out": { icon: PhoneOutgoing, tone: "brand" },
  "call-in": { icon: PhoneIncoming, tone: "info" },
  sms: { icon: MessageSquare, tone: "good" },
  email: { icon: Mail, tone: "neutral" },
};

const log = [
  { ch: "call-out" as Ch, who: "Karen Liu, Esq.", client: "Munro Estate", summary: "Discussed distribution timeline; sending draft inventory Friday.", time: "12m", billable: "0.3 hr" },
  { ch: "call-in" as Ch, who: "David Prescott", client: "E. Prescott", summary: "Son checking on mother's move; reassured, scheduled monthly update.", time: "1h", billable: "0.2 hr" },
  { ch: "email" as Ch, who: "Priya Nathan, CPA", client: "Whitfield Trust", summary: "Sent 2025 trust tax documents for preparation.", time: "3h", billable: "0.1 hr" },
  { ch: "sms" as Ch, who: "Marcus Webb, RN", client: "Delgado", summary: "Confirmed Thursday in-home visit.", time: "Yesterday", billable: "—" },
  { ch: "call-out" as Ch, who: "Sunrise Senior Living", client: "E. Prescott", summary: "Verified June billing before approving payment.", time: "Yesterday", billable: "0.2 hr" },
];

export default function CommunicationsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Practice"
        title="Communications"
        description="Every call, text, and email — logged against the client and captured as billable time."
        actions={
          <>
            <Button size="sm" variant="outline">
              <Phone className="size-4" /> Place call
            </Button>
            <Button size="sm">
              <Plus className="size-4" /> Log contact
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Contacts today" value="12" icon={MessageSquare} tone="brand" />
        <StatTile label="Calls this week" value="47" icon={Phone} />
        <StatTile label="Billable hrs logged" value="8.6" icon={Clock} tone="good" />
        <StatTile label="Awaiting reply" value="3" icon={Mail} tone="warning" />
      </div>

      <SectionCard title="Activity log" bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {log.map((l, i) => {
            const meta = chMeta[l.ch];
            return (
              <li key={i} className="flex items-start gap-3 px-5 py-4">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                  <meta.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-foreground">{l.who}</span>
                    <span className="text-xs text-muted-foreground">· {l.client}</span>
                    {l.billable !== "—" && <StatusPill tone="good">{l.billable}</StatusPill>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{l.summary}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{l.time}</span>
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </PageShell>
  );
}
