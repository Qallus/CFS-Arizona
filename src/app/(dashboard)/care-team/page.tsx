import { Scale, Calculator, Stethoscope, Building2, HeartHandshake, Plus, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, StatTile, StatusPill } from "@/components/dashboard/page-parts";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Care Team" };

type Contact = { name: string; org: string; phone: string; clients: number };
type Group = { label: string; icon: typeof Scale; tone: "brand" | "info" | "good" | "warning"; people: Contact[] };

const groups: Group[] = [
  {
    label: "Attorneys",
    icon: Scale,
    tone: "brand",
    people: [
      { name: "Karen Liu, Esq.", org: "Liu Elder Law", phone: "(602) 555-0148", clients: 7 },
      { name: "David Behrmann, Esq.", org: "Behrmann & Associates", phone: "(480) 555-0193", clients: 4 },
    ],
  },
  {
    label: "Accountants & CPAs",
    icon: Calculator,
    tone: "info",
    people: [
      { name: "Priya Nathan, CPA", org: "Nathan Tax Group", phone: "(602) 555-0177", clients: 12 },
    ],
  },
  {
    label: "Physicians & Care",
    icon: Stethoscope,
    tone: "good",
    people: [
      { name: "Dr. Elena Sandoval", org: "Banner Geriatrics", phone: "(602) 555-0110", clients: 5 },
      { name: "Marcus Webb, RN", org: "Home Care Partners", phone: "(623) 555-0164", clients: 8 },
    ],
  },
  {
    label: "Care Facilities",
    icon: Building2,
    tone: "warning",
    people: [
      { name: "Sunrise Senior Living", org: "Peoria campus", phone: "(623) 555-0100", clients: 6 },
      { name: "Desert Bloom Memory Care", org: "Chandler", phone: "(480) 555-0122", clients: 3 },
    ],
  },
  {
    label: "Family Contacts",
    icon: HeartHandshake,
    tone: "brand",
    people: [
      { name: "David Prescott", org: "Son of E. Prescott", phone: "(602) 555-0139", clients: 1 },
      { name: "Susan Munro-Kelly", org: "Daughter, Munro estate", phone: "(480) 555-0155", clients: 1 },
    ],
  },
];

export default function CareTeamPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Caseload"
        title="Care Team"
        description="The professionals and family CFS coordinates with on behalf of clients."
        actions={
          <Button size="sm">
            <Plus className="size-4" /> Add contact
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Total contacts" value="86" icon={HeartHandshake} tone="brand" />
        <StatTile label="Attorneys" value="9" icon={Scale} />
        <StatTile label="Care facilities" value="14" icon={Building2} />
        <StatTile label="Family contacts" value="38" icon={HeartHandshake} />
      </div>

      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.label}>
            <div className="mb-3 flex items-center gap-2">
              <g.icon className="size-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">{g.label}</h2>
              <span className="text-sm text-muted-foreground">· {g.people.length}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.people.map((p) => (
                <Card key={p.name} className="gap-0 py-0">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{p.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{p.org}</p>
                      </div>
                      <StatusPill tone={g.tone}>{p.clients} client{p.clients > 1 ? "s" : ""}</StatusPill>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="size-3.5" /> {p.phone}
                      </span>
                      <button className="ml-auto rounded-md p-1.5 hover:bg-secondary" title="Email">
                        <Mail className="size-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
