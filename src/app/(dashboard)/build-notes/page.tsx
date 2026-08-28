import Link from "next/link";
import {
  CheckCircle2,
  CircleDashed,
  CircleAlert,
  Mail,
  MessageSquare,
  KeyRound,
  MousePointerClick,
  ArrowRight,
  Map,
} from "lucide-react";
import {
  PageShell,
  SectionCard,
  StatusPill,
  StatTile,
  type Tone,
} from "@/components/dashboard/page-parts";

export const metadata = { title: "Build Notes" };

/* -------------------------------------------------------------------------
 * Where the build stands, kept next to the app it describes rather than in a
 * document nobody reopens. Hand-maintained: update the three workstreams
 * below as items land.
 * ---------------------------------------------------------------------- */

type State = "done" | "progress" | "todo";

const stateMeta: Record<State, { label: string; tone: Tone }> = {
  done: { label: "Shipped", tone: "good" },
  progress: { label: "In progress", tone: "warning" },
  todo: { label: "Not started", tone: "neutral" },
};

interface Item {
  what: string;
  detail: string;
  state: State;
}

interface Stream {
  id: string;
  title: string;
  blurb: string;
  icon: typeof Mail;
  items: Item[];
}

const streams: Stream[] = [
  {
    id: "comms",
    title: "Working leads inside the workflow",
    blurb:
      "Email a contact from the funnel itself, and have the record write itself to the timeline.",
    icon: Mail,
    items: [
      {
        what: "Email button on the contact workflow",
        detail:
          "Sits beside Log activity in the header, and disables itself when the contact has no address to reach.",
        state: "done",
      },
      {
        what: "Sending goes through Resend",
        detail:
          "A dedicated workflow route, separate from the older SMTP mailbox behind the compose and inbox screens. Replies are addressed back to whoever wrote the message, though the mail sends from the practice address.",
        state: "done",
      },
      {
        what: "Sends log themselves to the activity timeline",
        detail:
          "Recorded server-side, and only once Resend has accepted the message — so a failed send is never filed as a delivered one.",
        state: "done",
      },
      {
        what: "Text and call from the workflow",
        detail:
          "Built and working, including calls that record their own billable time, but not surfaced — Twilio is on hold. Restoring them is re-adding two buttons.",
        state: "todo",
      },
      {
        what: "Inbound email capture",
        detail:
          "Nothing yet reads replies back onto the timeline, so the record is one-sided. Phase two.",
        state: "todo",
      },
    ],
  },
  {
    id: "access",
    title: "Accounts that actually work",
    blurb:
      "An account is credentials plus a role. Creating only one half produced a user who could not sign in.",
    icon: KeyRound,
    items: [
      {
        what: "Adding a user directly now creates their sign-in",
        detail:
          "Manual add creates the Supabase Auth user with the email pre-confirmed and links it to the profile in one operation, instead of writing a profile that could never log in.",
        state: "done",
      },
      {
        what: "The login screen says what is actually wrong",
        detail:
          "Unconfirmed email, and authenticated-but-not-provisioned, are now distinct messages rather than all reading Invalid email or password.",
        state: "done",
      },
      {
        what: "Repair script for existing broken accounts",
        detail:
          "scripts/provision-user.mjs reports which half of an account is missing and fixes it. Dry run by default.",
        state: "done",
      },
      {
        what: "Confirm the service-role key in the deployed environment",
        detail:
          "If it is absent or belongs to another project, every profile lookup returns empty and a valid user looks unprovisioned. Needs checking against the live deployment.",
        state: "todo",
      },
    ],
  },
  {
    id: "today",
    title: "A Today page you can click",
    blurb:
      "Every row now leads somewhere. What it leads to is still placeholder content.",
    icon: MousePointerClick,
    items: [
      {
        what: "Every row on Today is a link",
        detail:
          "Deadlines, bills, follow-ups and referrals all navigate. Approve stays a separate control, since approving a payment is not the same as opening it.",
        state: "done",
      },
      {
        what: "The date and greeting are real",
        detail:
          "Both were hardcoded to a Wednesday in July. They now read the viewer's own clock.",
        state: "done",
      },
      {
        what: "Replace the placeholder lists with real records",
        detail:
          "All four lists are still hardcoded. The APIs behind them exist — the page was never connected to them.",
        state: "todo",
      },
      {
        what: "Detail pages for matters, bills and referrals",
        detail:
          "Rows currently land on a filtered list because these routes do not exist yet. They are real screens and deserve their own design pass.",
        state: "todo",
      },
      {
        what: "Make Approve do something",
        detail: "The button on each bill is presentational today.",
        state: "todo",
      },
    ],
  },
];

const decisions = [
  {
    q: "Which address does workflow email send from?",
    a: "Set by RESEND_FROM_EMAIL, and it must be on a domain verified in Resend. Until that is set the default is a sig360.com sender, which is wrong for this practice.",
  },
  {
    q: "How is call time rounded for billing?",
    a: "Written to round up to the whole minute, minimum one, but nothing bills yet while Twilio is on hold. Should match what the practice already defends in court accountings.",
  },
  {
    q: "When do text and voice come back?",
    a: "The code is in place behind the Twilio SDK. Turning it on is credentials plus re-adding the two buttons — worth deciding whether it lands before or after inbound email.",
  },
];

function StateIcon({ state }: { state: State }) {
  if (state === "done") return <CheckCircle2 className="size-4 text-emerald-500" />;
  if (state === "progress") return <CircleDashed className="size-4 text-amber-500" />;
  return <CircleAlert className="size-4 text-muted-foreground" />;
}

export default function BuildNotesPage() {
  const all = streams.flatMap((s) => s.items);
  const shipped = all.filter((i) => i.state === "done").length;
  const open = all.length - shipped;

  return (
    <PageShell>
      <div className="mb-6 sm:mb-8">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-brand">
          Product · Build notes
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          What we changed, and what is still open
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Three workstreams from the August 28 working session. Kept here rather than in a
          document so it stays next to the thing it describes.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Shipped" value={shipped} icon={CheckCircle2} tone="good" />
        <StatTile label="Still open" value={open} icon={CircleAlert} tone="warning" />
        <StatTile label="Workstreams" value={streams.length} icon={Map} tone="brand" />
        <StatTile
          label="Open decisions"
          value={decisions.length}
          icon={MessageSquare}
          hint="Need a call before building further"
        />
      </div>

      <div className="flex flex-col gap-4">
        {streams.map((stream) => {
          const Icon = stream.icon;
          const done = stream.items.filter((i) => i.state === "done").length;
          return (
            <SectionCard
              key={stream.id}
              title={stream.title}
              description={stream.blurb}
              action={
                <StatusPill tone={done === stream.items.length ? "good" : "warning"}>
                  {done} of {stream.items.length}
                </StatusPill>
              }
              bodyClassName="p-0"
            >
              <ul className="divide-y divide-border">
                {stream.items.map((item) => (
                  <li key={item.what} className="flex items-start gap-3 px-5 py-4">
                    <span className="mt-0.5 shrink-0">
                      <StateIcon state={item.state} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="font-medium text-foreground">{item.what}</p>
                        <StatusPill tone={stateMeta[item.state].tone}>
                          {stateMeta[item.state].label}
                        </StatusPill>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                    <span className="hidden shrink-0 text-muted-foreground sm:block">
                      <Icon className="size-4" />
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Open decisions"
          description="Worth settling before the next round of work"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {decisions.map((d) => (
              <li key={d.q} className="px-5 py-4">
                <p className="font-medium text-foreground">{d.q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d.a}</p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Try it"
          description="The changes that are visible in the app right now"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            <li>
              <Link
                href="/contacts"
                className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
                  <Mail className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">Open a contact&apos;s workflow</p>
                  <p className="text-sm text-muted-foreground">
                    Email now sits in the header, and logs itself
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
                  <MousePointerClick className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">Today</p>
                  <p className="text-sm text-muted-foreground">Every row clicks through</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          </ul>
        </SectionCard>
      </div>
    </PageShell>
  );
}
