import { Globe, Plus, Eye, MousePointerClick, FileText, ExternalLink } from "lucide-react";
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

export const metadata = { title: "Website" };

const pages = [
  { title: "Home", path: "/", updated: "Jul 10", status: "Published" },
  { title: "Services", path: "/services", updated: "Jul 10", status: "Published" },
  { title: "About Us", path: "/about", updated: "Jun 28", status: "Published" },
  { title: "FAQ", path: "/faq", updated: "Jun 28", status: "Published" },
  { title: "Resources", path: "/resources", updated: "Jul 12", status: "Draft" },
  { title: "Contact", path: "/contact", updated: "Jun 20", status: "Published" },
];

const inquiries = [
  { name: "The Okafor family", topic: "POA for aging parents", when: "3h ago", new: true },
  { name: "James Whitmore", topic: "Free consultation — trust", when: "Yesterday", new: true },
  { name: "Deborah Kane", topic: "Guardianship question", when: "2d ago", new: false },
];

export default function WebsitePage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Growth"
        title="Website"
        description="Manage cfsarizona.com content and capture inquiries directly — no WordPress required."
        actions={
          <>
            <Button size="sm" variant="outline" asChild>
              <a href="https://cfsarizona.com" target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> View site
              </a>
            </Button>
            <Button size="sm">
              <Plus className="size-4" /> New page
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Visitors (30d)" value="2,140" icon={Eye} tone="brand" />
        <StatTile label="Inquiries (30d)" value="18" icon={MousePointerClick} tone="good" />
        <StatTile label="Consultation requests" value="11" icon={MousePointerClick} tone="warning" />
        <StatTile label="Published pages" value="12" icon={FileText} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionCard title="Pages" description="Content served from Steward, not WordPress" bodyClassName="p-0">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Page</Th>
                  <Th>Path</Th>
                  <Th>Updated</Th>
                  <Th className="text-right">Status</Th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <Tr key={p.path}>
                    <Td className="font-medium text-foreground">{p.title}</Td>
                    <Td>
                      <span className="font-mono text-xs text-muted-foreground">{p.path}</span>
                    </Td>
                    <Td className="text-muted-foreground">{p.updated}</Td>
                    <Td className="text-right">
                      <StatusPill tone={p.status === "Published" ? "good" : "neutral"}>{p.status}</StatusPill>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard title="Recent inquiries" description="From the site contact form" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {inquiries.map((q) => (
                <li key={q.name} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
                    <Globe className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{q.topic}</p>
                    <p className="truncate text-sm text-muted-foreground">{q.name}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">{q.when}</span>
                    {q.new && <StatusPill tone="warning">New</StatusPill>}
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
