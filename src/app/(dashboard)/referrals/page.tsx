import { Share2, Plus, Scale, Building2, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, StatTile, StatusPill } from "@/components/dashboard/page-parts";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Referrals" };

type Card = { name: string; matter: string; source: string; when: string };
const columns: { label: string; tone: "info" | "brand" | "warning" | "good"; cards: Card[] }[] = [
  {
    label: "New",
    tone: "info",
    cards: [
      { name: "St. Joseph's discharge", matter: "Guardianship inquiry", source: "Hospital", when: "3h ago" },
      { name: "Website request", matter: "Trust administration", source: "cfsarizona.com", when: "1d ago" },
    ],
  },
  {
    label: "Contacted",
    tone: "brand",
    cards: [
      { name: "Est. of R. Coleman", matter: "Personal representative", source: "Behrmann & Assoc.", when: "2d ago" },
    ],
  },
  {
    label: "Consult scheduled",
    tone: "warning",
    cards: [
      { name: "The Okafor family", matter: "POA — aging parents", source: "Liu Elder Law", when: "Fri 10:00" },
      { name: "Gloria Hensley", matter: "Special needs trust", source: "Family", when: "Mon 2:00" },
    ],
  },
  {
    label: "Engaged",
    tone: "good",
    cards: [
      { name: "Cortez conservatorship", matter: "Conservator", source: "Maricopa County", when: "Onboarded" },
    ],
  },
];

const sources = [
  { icon: Scale, label: "Attorneys", value: "48%" },
  { icon: Building2, label: "Hospitals & facilities", value: "27%" },
  { icon: Globe, label: "Website & search", value: "16%" },
  { icon: Users, label: "Family & word of mouth", value: "9%" },
];

export default function ReferralsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Growth"
        title="Referrals"
        description="Intake from attorneys, discharge planners, and the website — tracked from inquiry to engagement."
        actions={
          <Button size="sm">
            <Plus className="size-4" /> Add referral
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Open referrals" value="6" icon={Share2} tone="brand" />
        <StatTile label="Consults this week" value="2" icon={Users} tone="warning" />
        <StatTile label="Engaged (YTD)" value="19" icon={Scale} tone="good" />
        <StatTile label="Conversion rate" value="64%" icon={Share2} />
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <div key={col.label} className="rounded-xl border border-border bg-card p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-foreground">{col.label}</span>
              <StatusPill tone={col.tone}>{col.cards.length}</StatusPill>
            </div>
            <div className="space-y-2">
              {col.cards.map((c) => (
                <div key={c.name} className="rounded-lg border border-border bg-background p-3">
                  <p className="font-medium text-foreground">{c.matter}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{c.name}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{c.source}</span>
                    <span>{c.when}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="p-5">
          <h2 className="mb-4 font-semibold text-foreground">Where referrals come from</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sources.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-secondary text-brand">
                  <s.icon className="size-5" />
                </span>
                <div>
                  <p className="text-lg font-semibold tabular-nums text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
