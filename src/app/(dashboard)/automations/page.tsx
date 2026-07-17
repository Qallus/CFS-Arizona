import { Zap, Plus, Gavel, Share2, HeartPulse, Wallet, Mail, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, StatTile, StatusPill } from "@/components/dashboard/page-parts";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Automations" };

const automations = [
  {
    icon: Gavel,
    category: "Compliance",
    name: "Court deadline watchdog",
    desc: "Warns the team 60, 30, and 7 days before any accounting or court report is due.",
    flow: ["Filing date nears", "Email + alert", "Create task"],
    status: "Active" as const,
    runs: "142 runs",
  },
  {
    icon: Share2,
    category: "Intake",
    name: "New-referral onboarding",
    desc: "Spins up the client record, matter, document checklist, and intake appointment.",
    flow: ["Referral received", "Create file", "Notify referrer"],
    status: "Active" as const,
    runs: "37 runs",
  },
  {
    icon: HeartPulse,
    category: "Care",
    name: "Wellness check cadence",
    desc: "Nudges the assigned staffer when a scheduled visit or call lapses past its window.",
    flow: ["Check-in overdue", "SMS staffer", "Log outcome"],
    status: "Active" as const,
    runs: "308 runs",
  },
  {
    icon: Wallet,
    category: "Money",
    name: "Recurring bill pay & low-balance alert",
    desc: "Queues known monthly bills for approval and warns before an account runs short.",
    flow: ["Bill due / low balance", "Queue approval", "Alert fiduciary"],
    status: "Active" as const,
    runs: "521 runs",
  },
  {
    icon: Mail,
    category: "Family",
    name: "Automatic family updates",
    desc: "Generates a plain-language monthly summary per client for approved family contacts.",
    flow: ["Monthly schedule", "Draft summary", "Send to family"],
    status: "Paused" as const,
    runs: "0 runs",
  },
  {
    icon: Globe,
    category: "Growth",
    name: "Website inquiry capture",
    desc: "Routes cfsarizona.com consultation requests into Referrals with an instant auto-reply.",
    flow: ["Form submitted", "Create referral", "Auto-reply + task"],
    status: "Active" as const,
    runs: "24 runs",
  },
];

export default function AutomationsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Practice"
        title="Automations"
        description="Recipes that turn fiduciary duty into a system — so nothing depends on memory."
        actions={
          <Button size="sm">
            <Plus className="size-4" /> New automation
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Active automations" value="5" icon={Zap} tone="brand" />
        <StatTile label="Runs this month" value="1,032" icon={Zap} tone="good" />
        <StatTile label="Tasks created" value="196" icon={Gavel} />
        <StatTile label="Paused" value="1" icon={Zap} tone="warning" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {automations.map((a) => (
          <Card key={a.name} className="gap-0 py-0">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">
                  <a.icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-brass">{a.category}</p>
                    <StatusPill tone={a.status === "Active" ? "good" : "neutral"} className="ml-auto">
                      {a.status}
                    </StatusPill>
                  </div>
                  <p className="mt-0.5 font-semibold text-foreground">{a.name}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{a.desc}</p>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {a.flow.map((step, i) => (
                  <span key={step} className="flex items-center gap-1.5">
                    <span
                      className={`rounded-md border px-2 py-1 text-[11px] ${
                        i === 0 ? "border-brand/50 text-brand" : "border-border bg-secondary/60 text-foreground"
                      }`}
                    >
                      {step}
                    </span>
                    {i < a.flow.length - 1 && <ArrowRight className="size-3 text-muted-foreground" />}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{a.runs}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
