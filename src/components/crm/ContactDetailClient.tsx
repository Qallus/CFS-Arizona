'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Users,
  Bell,
  Send,
  StickyNote,
  Check,
  Plus,
  Clock,
  ChevronRight,
  ChevronLeft,
  UserCircle,
  GitBranch,
  AlarmClock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PageShell,
  SectionCard,
  StatusPill,
  StatTile,
  EmptyState,
} from '@/components/dashboard/page-parts';
import { cn } from '@/lib/utils';
import { LogActivityModal } from './LogActivityModal';
import { WorkflowPath, WorkflowActions } from './WorkflowPath';
import type { WorkflowStage } from './workflow-meta';
import { MultiCombobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FollowUpsPanel } from './FollowUpsPanel';
import {
  STAGES,
  type Stage,
  type Disposition,
  stageLabel,
  stageBlurb,
  stageTone,
  dispositionLabel,
  dispositionTone,
  matterTypeLabel,
  MATTER_TYPES,
  parseMatterTypes,
  formatMatterTypes,
  contactDisplayName,
} from './crm-meta';

interface Contact {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  preferredName: string | null;
  salutation: string | null;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  dateOfBirth: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  referralSource: string | null;
  referralSourceDetail: string | null;
  matterType: string | null;
  preferredContactMethod: string | null;
  status: string | null;
  // PNFF sheet fields
  ccFeeDue: string | null;
  staffContact: string | null;
  lastContactType: string | null;
  contactDate: string | null;
  sendFollowUpEmailAt: string | null;
  emailFollowUpAt: string | null;
  finalClosureNoticeAt: string | null;
  statusNotes: string | null;
  secondaryFirstName: string | null;
  secondaryLastName: string | null;
  secondaryDateOfBirth: string | null;
  secondaryEmail: string | null;
  secondaryPhone: string | null;
  referralDate: string | null;
  referralType: string | null;
  attorney: string | null;
  notes: string | null;
}
interface Opportunity {
  id: string;
  stage: Stage;
  disposition: Disposition;
  interestMeetingAt: string | null;
  intakeMeetingAt: string | null;
  cifComplete: boolean;
  epDocsComplete: boolean;
  feeComplete: boolean;
  workflowStage: WorkflowStage;
  closedStatus: string | null;
}
interface Activity {
  id: string;
  type: string;
  direction: string | null;
  subject: string | null;
  body: string | null;
  occurredAt: string | null;
  billableMinutes: number;
}

const activityIcon: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  sms: MessageSquare,
  meeting: Users,
  reminder: Bell,
  mail: Send,
  note: StickyNote,
};

// Per-contact stat cards (click to filter the timeline by type).
const CONTACT_STATS: { key: string; label: string; icon: typeof Phone }[] = [
  { key: 'call', label: 'Calls', icon: Phone },
  { key: 'email', label: 'Emails', icon: Mail },
  { key: 'sms', label: 'Texts', icon: MessageSquare },
  { key: 'meeting', label: 'Meetings', icon: Users },
  { key: 'note', label: 'Notes', icon: StickyNote },
  { key: 'reminder', label: 'Tasks', icon: Bell },
];

function fmt(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function ContactDetailClient({ contactId }: { contactId: string }) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activityFilter, setActivityFilter] = useState<string>('all');

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of activities) c[a.type] = (c[a.type] ?? 0) + 1;
    return c;
  }, [activities]);

  const filteredActivities = useMemo(
    () => (activityFilter === 'all' ? activities : activities.filter((a) => a.type === activityFilter)),
    [activities, activityFilter],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, oRes, aRes] = await Promise.all([
        fetch(`/api/crm/contacts/${contactId}`),
        fetch(`/api/crm/opportunities?contactId=${contactId}`),
        fetch(`/api/crm/activities?contactId=${contactId}`),
      ]);
      const cData = await cRes.json();
      if (!cRes.ok || !cData.contact) {
        setNotFound(true);
        return;
      }
      setContact(cData.contact);
      const oData = await oRes.json();
      setOpp(oData.opportunities?.[0] ?? null);
      const aData = await aRes.json();
      setActivities(Array.isArray(aData.activities) ? aData.activities : []);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    load();
  }, [load]);

  async function patchOpp(body: Record<string, unknown>) {
    if (!opp) return;
    setBusy(true);
    try {
      await fetch(`/api/crm/opportunities/${opp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function startFunnel() {
    setBusy(true);
    try {
      await fetch('/api/crm/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <PageShell>
        <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
      </PageShell>
    );
  }
  if (notFound || !contact) {
    return (
      <PageShell>
        <EmptyState icon={Users} title="Contact not found" description="It may have been removed or is assigned to another staff member." />
        <div className="mt-4 text-center">
          <Button asChild variant="outline"><Link href="/contacts"><ArrowLeft className="size-4" /> Back to contacts</Link></Button>
        </div>
      </PageShell>
    );
  }

  const name = contactDisplayName(contact);
  const currentIdx = opp ? STAGES.indexOf(opp.stage) : -1;
  const nextStage: Stage | null = currentIdx >= 0 && currentIdx < STAGES.length - 1 ? STAGES[currentIdx + 1] : null;
  // Contacts do move backwards — a deal cools, or someone mis-clicks during
  // training. The funnel has to be correctable in both directions.
  const prevStage: Stage | null = currentIdx > 0 ? STAGES[currentIdx - 1] : null;
  const isDormantOrExit = opp && (opp.disposition === 'exit' || opp.disposition.startsWith('dormant'));

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand/15 text-lg font-semibold text-brand">
              {name[0]?.toUpperCase()}
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {opp ? (
                  <>
                    <StatusPill tone={stageTone[opp.stage]}>{stageLabel[opp.stage]}</StatusPill>
                    <StatusPill tone={dispositionTone[opp.disposition]}>{dispositionLabel[opp.disposition]}</StatusPill>
                  </>
                ) : (
                  <StatusPill tone="neutral">No opportunity</StatusPill>
                )}
                {contact.matterType && (
                  <span className="text-sm text-muted-foreground">{formatMatterTypes(contact.matterType)}</span>
                )}
              </div>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowLog(true)}>
            <Plus className="size-4" /> Log activity
          </Button>
        </div>
      </div>

      {/* Two tabs: the record itself, and the funnel it is moving through.
          Details is first and default — landing straight in the funnel was
          disorienting, and the editable fields were buried in a side rail. */}
      <Tabs defaultValue="details">
        <TabsList className="mb-4">
          <TabsTrigger value="details" className="gap-1.5">
            <UserCircle className="size-4" /> Contact details
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-1.5">
            <GitBranch className="size-4" /> Workflow &amp; funnel
          </TabsTrigger>
          <TabsTrigger value="followups" className="gap-1.5">
            <AlarmClock className="size-4" /> Next steps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <DetailsPanel contact={contact} onSaved={load} />
        </TabsContent>

        <TabsContent value="workflow">
        <div className="space-y-4">
          {/* Lead servicing workflow (Salesforce-style path) */}
          {opp && (
            <SectionCard
              title="Lead servicing workflow"
              description="Every lead is serviced through this consistent path."
              action={
                <WorkflowActions
                  workflowStage={opp.workflowStage}
                  closedStatus={opp.closedStatus}
                  busy={busy}
                  onSet={(stage) => patchOpp({ workflowStage: stage })}
                />
              }
            >
              <WorkflowPath workflowStage={opp.workflowStage} closedStatus={opp.closedStatus} />
            </SectionCard>
          )}

          {/* Stage stepper */}
          <SectionCard title="Fiduciary funnel" description={opp ? stageBlurb[opp.stage] : 'Start this contact in the funnel.'}>
            {!opp ? (
              <Button onClick={startFunnel} disabled={busy}>Start funnel at Awareness</Button>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  {STAGES.map((s, i) => (
                    <div key={s} className="flex flex-1 items-center gap-1.5">
                      {/* Any stage is clickable, forwards or back. */}
                      <button
                        type="button"
                        onClick={() => i !== currentIdx && patchOpp({ stage: s })}
                        disabled={busy || i === currentIdx}
                        title={
                          i === currentIdx
                            ? `Currently at ${stageLabel[s]}`
                            : i < currentIdx
                              ? `Move back to ${stageLabel[s]}`
                              : `Move forward to ${stageLabel[s]}`
                        }
                        className={cn(
                          'flex-1 rounded-md px-2 py-2 text-center text-xs font-medium transition-colors',
                          i < currentIdx && 'bg-brand/15 text-brand hover:bg-brand/25',
                          i === currentIdx && 'bg-brand text-brand-foreground cursor-default',
                          i > currentIdx && 'bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
                          busy && 'opacity-60',
                        )}
                      >
                        {stageLabel[s]}
                      </button>
                      {i < STAGES.length - 1 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
                    </div>
                  ))}
                </div>

                {/* Gate checklist */}
                <div className="mt-5 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Completion items (Nurture gate)</p>
                  <GateRow label="Interest meeting held" done={!!opp.interestMeetingAt} onToggle={() => patchOpp({ interestMeetingAt: opp.interestMeetingAt ? null : new Date().toISOString() })} disabled={busy} />
                  <GateRow label="Intake meeting held" done={!!opp.intakeMeetingAt} onToggle={() => patchOpp({ intakeMeetingAt: opp.intakeMeetingAt ? null : new Date().toISOString() })} disabled={busy} />
                  <GateRow label="CIF complete" done={opp.cifComplete} onToggle={() => patchOpp({ cifComplete: !opp.cifComplete })} disabled={busy} />
                  <GateRow label="EP docs complete" done={opp.epDocsComplete} onToggle={() => patchOpp({ epDocsComplete: !opp.epDocsComplete })} disabled={busy} />
                  <GateRow label="Fee complete" done={opp.feeComplete} onToggle={() => patchOpp({ feeComplete: !opp.feeComplete })} disabled={busy} />
                </div>

                {/* Actions */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {nextStage && !isDormantOrExit && (
                    <Button size="sm" onClick={() => patchOpp({ stage: nextStage })} disabled={busy}>
                      Advance to {stageLabel[nextStage]}
                    </Button>
                  )}
                  {prevStage && !isDormantOrExit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => patchOpp({ stage: prevStage })}
                      disabled={busy}
                    >
                      <ChevronLeft className="size-4" /> Back to {stageLabel[prevStage]}
                    </Button>
                  )}
                  {isDormantOrExit ? (
                    <Button size="sm" variant="outline" onClick={() => patchOpp({ disposition: 'active' })} disabled={busy}>
                      Return to funnel
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => patchOpp({ disposition: 're_engagement' })} disabled={busy}>
                        Mark stalled
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => patchOpp({ disposition: 'dormant_no_response' })} disabled={busy}>
                        Dormant · no response
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => patchOpp({ disposition: 'dormant_deferred' })} disabled={busy}>
                        Dormant · deferred
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => patchOpp({ disposition: 'exit' })} disabled={busy}>
                        Exit
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </SectionCard>

          {/* Per-contact stat cards — click to filter the timeline */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {CONTACT_STATS.map((s) => (
              <StatTile
                key={s.key}
                compact
                label={s.label}
                value={typeCounts[s.key] ?? 0}
                icon={s.icon}
                active={activityFilter === s.key}
                onClick={() => setActivityFilter((f) => (f === s.key ? 'all' : s.key))}
              />
            ))}
          </div>

          {/* Activity timeline */}
          <SectionCard
            title="Activity timeline"
            description={activityFilter === 'all' ? 'Calls, emails, meetings — the billable record' : `Filtered by ${activityFilter}`}
            action={
              <div className="flex items-center gap-1">
                {activityFilter !== 'all' && (
                  <Button size="sm" variant="ghost" onClick={() => setActivityFilter('all')}>
                    Clear
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setShowLog(true)}>
                  <Plus className="size-4" /> Log
                </Button>
              </div>
            }
            bodyClassName="p-0"
          >
            {filteredActivities.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={StickyNote}
                  title={activities.length === 0 ? 'No activity yet' : 'Nothing of this type'}
                  description={activities.length === 0 ? 'Log a call, email, or meeting to build the record.' : 'Try a different filter or clear it.'}
                />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filteredActivities.map((a) => {
                  const Icon = activityIcon[a.type] ?? StickyNote;
                  return (
                    <li key={a.id} className="flex items-start gap-3 px-5 py-4">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-medium capitalize text-foreground">{a.subject || a.type}</span>
                          {a.direction && <span className="text-xs text-muted-foreground">· {a.direction === 'in' ? 'inbound' : 'outbound'}</span>}
                          {a.billableMinutes > 0 && (
                            <StatusPill tone="good"><Clock className="size-3" /> {a.billableMinutes}m</StatusPill>
                          )}
                        </div>
                        {a.body && <p className="mt-0.5 text-sm text-muted-foreground">{a.body}</p>}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{fmt(a.occurredAt)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
        </TabsContent>

        <TabsContent value="followups">
          <FollowUpsPanel contactId={contactId} />
        </TabsContent>
      </Tabs>

      <LogActivityModal open={showLog} onOpenChange={setShowLog} contactId={contactId} opportunityId={opp?.id ?? null} onLogged={load} />
    </PageShell>
  );
}

function GateRow({ label, done, onToggle, disabled }: { label: string; done: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-md px-1 py-1.5 text-left text-sm transition-colors hover:bg-secondary/40 disabled:opacity-60"
    >
      <span className={cn('grid size-5 place-items-center rounded border', done ? 'border-brand bg-brand text-brand-foreground' : 'border-input text-transparent')}>
        <Check className="size-3.5" />
      </span>
      <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </button>
  );
}

const MATTER_OPTIONS = MATTER_TYPES.map((m) => ({ value: m, label: matterTypeLabel[m] }));

/**
 * Contact details, grouped and editable.
 *
 * Replaces the old CIF side rail. Two things were wrong with it: it was
 * squeezed into a third of the page next to the funnel, and it had no name
 * fields at all — so a misspelled contact could never be corrected, even
 * though the API has always accepted firstName/lastName.
 */
const FIELD_GROUPS: {
  title: string;
  fields: { key: keyof Contact; label: string; type?: string; placeholder?: string }[];
}[] = [
  {
    title: 'Primary contact',
    fields: [
      { key: 'salutation', label: 'Salutation', placeholder: 'Mrs.' },
      { key: 'firstName', label: 'First name' },
      { key: 'lastName', label: 'Last name' },
      { key: 'preferredName', label: 'Preferred name', placeholder: 'What they go by' },
      { key: 'dateOfBirth', label: 'Date of birth', type: 'date' },
    ],
  },
  {
    title: 'Secondary contact',
    fields: [
      { key: 'secondaryFirstName', label: 'First name' },
      { key: 'secondaryLastName', label: 'Last name' },
      { key: 'secondaryDateOfBirth', label: 'Date of birth', type: 'date' },
    ],
  },
  {
    title: 'Contact information',
    fields: [
      { key: 'email', label: 'Primary email', type: 'email' },
      { key: 'secondaryEmail', label: 'Secondary email', type: 'email' },
      { key: 'mobilePhone', label: 'Primary phone', type: 'tel' },
      { key: 'secondaryPhone', label: 'Secondary phone', type: 'tel' },
      // Kept even though it is not in the CFS field list: the column holds
      // data on existing contacts, and dropping the input would hide it.
      { key: 'phone', label: 'Other phone', type: 'tel' },
    ],
  },
  {
    title: 'Address',
    fields: [
      { key: 'addressLine1', label: 'Street address' },
      { key: 'addressLine2', label: 'Unit / apt' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'zipCode', label: 'ZIP' },
    ],
  },
  {
    title: 'Engagement',
    fields: [
      { key: 'status', label: 'Status', placeholder: 'Initial Contact' },
      { key: 'staffContact', label: 'Staff contact', placeholder: 'TL' },
      { key: 'lastContactType', label: 'Last contact type', placeholder: 'Initial Consult' },
      { key: 'contactDate', label: 'Last contact date', type: 'date' },
      { key: 'ccFeeDue', label: 'CC fee due', placeholder: 'Due Upon Intake' },
    ],
  },
  {
    title: 'Follow-up sequence',
    fields: [
      { key: 'sendFollowUpEmailAt', label: 'Follow-up email sent', type: 'date' },
      { key: 'emailFollowUpAt', label: 'Second follow-up', type: 'date' },
      { key: 'finalClosureNoticeAt', label: 'Closure notice sent', type: 'date' },
    ],
  },
  {
    title: 'Referral',
    fields: [
      { key: 'referralSource', label: 'Referred by', placeholder: 'Attorney, hospital, website…' },
      { key: 'referralSourceDetail', label: 'Referral detail' },
      { key: 'referralDate', label: 'Referral date', type: 'date' },
      { key: 'referralType', label: 'Referral type', placeholder: 'PNFF' },
      { key: 'attorney', label: 'Attorney (as applicable)' },
    ],
  },
];

/** Sections open on first visit. The rest collapse to keep the form short. */
const DEFAULT_OPEN = ['Primary contact', 'Contact information'];
const OPEN_STORAGE_KEY = 'cfs_contact_sections_open';

/**
 * One collapsible section.
 *
 * The filled-count badge matters more than it looks: a collapsed section is
 * otherwise a black box, and "Address 0/5" tells you there is nothing behind
 * it without expanding.
 */
function Section({
  title,
  filled,
  total,
  open,
  onToggle,
  children,
}: {
  title: string;
  filled: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border first:border-t-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-3 text-left"
      >
        <ChevronRight
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-90',
          )}
        />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        <span
          className={cn(
            'ml-auto rounded-full px-2 py-0.5 text-[11px] tabular-nums',
            filled === 0 ? 'text-muted-foreground' : 'bg-brand/10 text-brand',
          )}
        >
          {filled}/{total}
        </span>
      </button>
      {open && <div className="grid gap-3 pb-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>}
    </div>
  );
}

function DetailsPanel({ contact, onSaved }: { contact: Contact; onSaved: () => void }) {
  const [form, setForm] = useState<Contact>(contact);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<string[]>(DEFAULT_OPEN);

  // Whichever sections someone works in, they work in every time.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(OPEN_STORAGE_KEY);
      if (saved) setOpenSections(JSON.parse(saved));
    } catch {
      /* a corrupt preference is not worth breaking the form over */
    }
  }, []);

  function toggleSection(title: string) {
    setOpenSections((prev) => {
      const next = prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title];
      try {
        localStorage.setItem(OPEN_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* private browsing — the accordion still works, it just forgets */
      }
      return next;
    });
  }

  useEffect(() => setForm(contact), [contact]);

  function set(key: keyof Contact, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    setSavedAt(null);
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName ?? '',
          lastName: form.lastName ?? '',
          salutation: form.salutation ?? '',
          preferredName: form.preferredName ?? '',
          email: form.email ?? '',
          mobilePhone: form.mobilePhone ?? '',
          phone: form.phone ?? '',
          dateOfBirth: form.dateOfBirth || null,
          addressLine1: form.addressLine1 ?? '',
          addressLine2: form.addressLine2 ?? '',
          city: form.city ?? '',
          state: form.state ?? '',
          zipCode: form.zipCode ?? '',
          referralSource: form.referralSource ?? '',
          referralSourceDetail: form.referralSourceDetail ?? '',
          matterType: form.matterType ?? '',
          secondaryFirstName: form.secondaryFirstName ?? '',
          secondaryLastName: form.secondaryLastName ?? '',
          secondaryDateOfBirth: form.secondaryDateOfBirth || null,
          secondaryEmail: form.secondaryEmail ?? '',
          secondaryPhone: form.secondaryPhone ?? '',
          referralDate: form.referralDate || null,
          referralType: form.referralType ?? '',
          attorney: form.attorney ?? '',
          status: form.status ?? '',
          ccFeeDue: form.ccFeeDue ?? '',
          staffContact: form.staffContact ?? '',
          lastContactType: form.lastContactType ?? '',
          contactDate: form.contactDate || null,
          sendFollowUpEmailAt: form.sendFollowUpEmailAt || null,
          emailFollowUpAt: form.emailFollowUpAt || null,
          finalClosureNoticeAt: form.finalClosureNoticeAt || null,
          statusNotes: form.statusNotes ?? '',
          notes: form.notes ?? '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the contact.');
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString());
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Client information (CIF)"
        description="Everything on this contact. Changes save when you press Save."
        action={
          <div className="flex items-center gap-2">
            {savedAt && !dirty && (
              <span className="text-xs text-muted-foreground">Saved {savedAt}</span>
            )}
            <Button size="sm" onClick={save} disabled={saving || !dirty}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        {error && (
          <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="space-y-1.5">
          <Label>
            Matter type <span className="font-normal text-muted-foreground">(any that apply)</span>
          </Label>
          <MultiCombobox
            options={MATTER_OPTIONS}
            value={parseMatterTypes(form.matterType)}
            onChange={(v) => set('matterType', v.join(','))}
            placeholder="Select matter types…"
          />
        </div>

        <div className="mt-4">
          {FIELD_GROUPS.map((group) => {
            const filled = group.fields.filter((f) => {
              const v = form[f.key];
              return typeof v === 'string' && v.trim() !== '';
            }).length;
            return (
              <Section
                key={group.title}
                title={group.title}
                filled={filled}
                total={group.fields.length}
                open={openSections.includes(group.title)}
                onToggle={() => toggleSection(group.title)}
              >
                {group.fields.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label htmlFor={`cif-${f.key}`}>{f.label}</Label>
                    {f.type === 'date' ? (
                      <DatePicker
                        value={(form[f.key] as string) ?? ''}
                        onChange={(v) => set(f.key, v)}
                      />
                    ) : (
                      <Input
                        id={`cif-${f.key}`}
                        type={f.type ?? 'text'}
                        value={(form[f.key] as string) ?? ''}
                        onChange={(e) => set(f.key, e.target.value)}
                        placeholder={f.placeholder}
                      />
                    )}
                  </div>
                ))}
              </Section>
            );
          })}
        </div>
      </SectionCard>

      {dirty && (
        <p className="text-center text-xs text-muted-foreground">
          You have unsaved changes.
        </p>
      )}
    </div>
  );
}
