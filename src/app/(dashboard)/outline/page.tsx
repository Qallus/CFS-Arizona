import Link from "next/link";
import {
  CheckCircle2,
  CircleAlert,
  Mail,
  MessageSquare,
  KeyRound,
  MousePointerClick,
  ArrowRight,
  Map,
  Phone,
  Database,
  Send,
} from "lucide-react";
import {
  PageShell,
  SectionCard,
  StatusPill,
  StatTile,
  type Tone,
} from "@/components/dashboard/page-parts";

export const metadata = { title: "Outline" };

/* -------------------------------------------------------------------------
 * Where the build stands and what comes next, kept next to the app it
 * describes rather than in a document nobody reopens. Hand-maintained: the
 * arrays below are the content.
 * ---------------------------------------------------------------------- */

type State = "done" | "next" | "later";

const stateMeta: Record<State, { label: string; tone: Tone }> = {
  done: { label: "Done", tone: "good" },
  next: { label: "Next", tone: "warning" },
  later: { label: "Later", tone: "neutral" },
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
  items: Item[];
}

/* ----------------------------- completed ------------------------------ */

const completed: Stream[] = [
  {
    id: "comms",
    title: "Working leads inside the workflow",
    blurb: "Email a contact from the funnel, and have the record write itself.",
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
          "A dedicated workflow route, kept separate from the older SMTP mailbox behind the compose and inbox screens. Mail leaves from the practice address with reply-to set to whoever wrote it.",
        state: "done",
      },
      {
        what: "Sends log themselves to the timeline",
        detail:
          "Written server-side, and only once Resend accepts the message — so a failed send is never filed as a delivered one.",
        state: "done",
      },
    ],
  },
  {
    id: "access",
    title: "Accounts that actually work",
    blurb:
      "An account is credentials plus a role. Creating only one half produced a user who could not sign in.",
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
          "scripts/provision-user.mjs reports which half of an account is missing and fixes it. Dry run unless passed --apply.",
        state: "done",
      },
    ],
  },
  {
    id: "today",
    title: "A Today page you can click",
    blurb: "Every row now leads somewhere.",
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
          "Both were hardcoded to a Wednesday in July. They now read the practice's own clock in Arizona time.",
        state: "done",
      },
    ],
  },
];

/* ----------------------------- next steps ----------------------------- */

interface Integration {
  id: string;
  name: string;
  icon: typeof Mail;
  status: string;
  statusTone: Tone;
  how: string;
  env: string[];
  steps: Item[];
}

const integrations: Integration[] = [
  {
    id: "resend",
    name: "Resend",
    icon: Send,
    status: "Wired, not yet live",
    statusTone: "warning",
    how:
      "Already the transport for workflow email and for invite emails. The app talks to Resend's HTTP API directly from src/lib/email.ts — no SDK, no extra dependency. Every send routes through one function, so anything added later (templates, campaigns, receipts) inherits the same path.",
    env: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"],
    steps: [
      {
        what: "Verify a sending domain in Resend",
        detail:
          "cfsarizona.com needs its DNS records added in Resend. Until it verifies, every send is rejected — this is the one blocking step.",
        state: "next",
      },
      {
        what: "Set the two environment variables in Coolify",
        detail:
          "Neither is present today. RESEND_FROM_EMAIL must sit on the verified domain; its default is a sig360.com sender belonging to a different practice.",
        state: "next",
      },
      {
        what: "Send a real test from a contact's workflow",
        detail:
          "Confirms the key, the domain, and the timeline write in one action. Nothing here has been exercised against live credentials yet.",
        state: "next",
      },
      {
        what: "Capture replies onto the timeline",
        detail:
          "Resend can post inbound mail to a webhook. Pointed at the same logger the outbound path uses, the record becomes two-sided instead of one.",
        state: "later",
      },
      {
        what: "Branded email templates",
        detail:
          "The invite email is still SIG360-branded, navy and all. It needs the CFS lockup and palette before anyone outside the office receives one.",
        state: "later",
      },
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    icon: Phone,
    status: "Built, on hold",
    statusTone: "neutral",
    how:
      "Text and voice are already written against the workflow, including calls that record their own billable time from when they actually connected. Voice runs in the browser on the Twilio Voice SDK, so a call is placed from the app rather than a handset. Nothing is surfaced while this is on hold — a button that dials nothing is worse than no button.",
    env: [
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_SMS_PHONE_NUMBER",
      "TWILIO_PHONE_NUMBER",
      "TWILIO_TWIML_APP_SID",
      "TWILIO_API_KEY_SID",
      "TWILIO_API_KEY_SECRET",
    ],
    steps: [
      {
        what: "Decide whether texting comes before or after inbound email",
        detail:
          "Both make the timeline two-sided. Texting is the one clients actually reply to; inbound email is the one already half-built.",
        state: "next",
      },
      {
        what: "Restore the Text and Call buttons",
        detail:
          "Two triggers in the workflow header and two modal mounts at the foot of the same component. The comment at the removal site says exactly what to re-add.",
        state: "later",
      },
      {
        what: "Point the inbound SMS webhook at the timeline",
        detail:
          "/api/sms/incoming already receives replies and stores them. It needs to also write the contact's timeline so texts sit alongside calls and email.",
        state: "later",
      },
      {
        what: "Settle call-time rounding with Brent",
        detail:
          "Written to round up to the whole minute, minimum one. A billing policy question — it should match what the practice already defends in court accountings.",
        state: "later",
      },
    ],
  },
];

const dataWork: Item[] = [
  {
    what: "Replace the placeholder lists on Today",
    detail:
      "All four lists are still hardcoded. The APIs behind them already exist — follow-ups, referrals, ledger and matters — the page was simply never connected to them.",
    state: "next",
  },
  {
    what: "Detail pages for matters, bills and referrals",
    detail:
      "Rows currently land on a filtered list because /matters/[id], /bill-pay/[id] and /referrals/[id] do not exist. Each row already carries the href it will keep once they do.",
    state: "later",
  },
  {
    what: "Make Approve do something",
    detail: "The button on each bill is presentational today.",
    state: "later",
  },
  {
    what: "Run the account repair script against the live database",
    detail:
      "Unblocks Brent, and confirms the service-role key is correct in the deployment. If that key is wrong, every profile lookup returns empty and a valid user looks unprovisioned.",
    state: "next",
  },
];

function StateIcon({ state }: { state: State }) {
  if (state === "done") return <CheckCircle2 className="size-4 text-emerald-500" />;
  return <CircleAlert className="size-4 text-muted-foreground" />;
}

function ItemRow({ item }: { item: Item }) {
  return (
    <li className="flex items-start gap-3 px-5 py-4">
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
    </li>
  );
}

export default function OutlinePage() {
  const doneCount = completed.flatMap((s) => s.items).length;
  const nextCount =
    integrations.flatMap((i) => i.steps).filter((s) => s.state === "next").length +
    dataWork.filter((d) => d.state === "next").length;

  return (
    <PageShell>
      <div className="mb-6 sm:mb-8">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-brand">
          Product · Outline
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          What is built, and what comes next
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Kept in the app rather than in a document, so it stays next to the thing it
          describes.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Shipped" value={doneCount} icon={CheckCircle2} tone="good" />
        <StatTile label="Up next" value={nextCount} icon={CircleAlert} tone="warning" />
        <StatTile label="Integrations" value={integrations.length} icon={Map} tone="brand" />
        <StatTile
          label="Blocking"
          value={1}
          icon={Send}
          tone="critical"
          hint="Resend domain verification"
        />
      </div>

      {/* ---------------------------- completed --------------------------- */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Completed
      </h2>
      <div className="mb-8 flex flex-col gap-4">
        {completed.map((stream) => (
          <SectionCard
            key={stream.id}
            title={stream.title}
            description={stream.blurb}
            action={<StatusPill tone="good">{stream.items.length} shipped</StatusPill>}
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-border">
              {stream.items.map((item) => (
                <ItemRow key={item.what} item={item} />
              ))}
            </ul>
          </SectionCard>
        ))}
      </div>

      {/* --------------------------- integrations ------------------------- */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Next steps — integrations
      </h2>
      <div className="mb-8 flex flex-col gap-4">
        {integrations.map((it) => {
          const Icon = it.icon;
          return (
            <SectionCard
              key={it.id}
              title={it.name}
              description={it.status}
              action={<StatusPill tone={it.statusTone}>{it.status}</StatusPill>}
              bodyClassName="p-0"
            >
              <div className="flex items-start gap-3 border-b border-border px-5 py-4">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-muted-foreground">{it.how}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {it.env.map((v) => (
                      <code
                        key={v}
                        className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                      >
                        {v}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
              <ul className="divide-y divide-border">
                {it.steps.map((s) => (
                  <ItemRow key={s.what} item={s} />
                ))}
              </ul>
            </SectionCard>
          );
        })}
      </div>

      {/* ------------------------------ data ------------------------------ */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Next steps — real data
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="From placeholder to live records"
          description="The screens are built; most of them are still showing fiction"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {dataWork.map((d) => (
              <ItemRow key={d.what} item={d} />
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Try it" description="Visible in the app right now" bodyClassName="p-0">
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
                    Email sits in the header, and logs itself
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
            <li className="flex items-start gap-3 px-5 py-4">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                <KeyRound className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">Account repair</p>
                <p className="text-sm text-muted-foreground">
                  <code className="font-mono text-[12px]">
                    node scripts/provision-user.mjs --email you@cfsarizona.com
                  </code>
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 px-5 py-4">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                <Database className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">Not yet verified</p>
                <p className="text-sm text-muted-foreground">
                  No email, call or sign-in has been exercised against live credentials. Every
                  item above is read from the code.
                </p>
              </div>
            </li>
          </ul>
        </SectionCard>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        <MessageSquare className="mr-1 inline size-3" />
        Hand-maintained — edit the arrays at the top of this page as items land.
      </p>
    </PageShell>
  );
}
