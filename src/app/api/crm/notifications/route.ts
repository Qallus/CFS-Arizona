import { NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { listOpportunities } from '@/lib/crm/opportunities';
import { contactDisplayNameFromRow } from '@/lib/crm/opportunities';

/**
 * GET /api/crm/notifications — actionable items for the bell:
 *   follow-ups due/overdue, untriaged new referrals, and stalled records.
 */
export async function GET() {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  try {
    const opps = await listOpportunities(gate.user);
    const now = Date.now();
    const items: { id: string; type: string; label: string; sublabel: string; contactId: string; tone: string }[] = [];

    for (const o of opps) {
      const name = contactDisplayNameFromRow(o.contact);
      if (o.nextFollowUpAt && new Date(o.nextFollowUpAt).getTime() <= now && o.disposition !== 'exit') {
        items.push({ id: `fu-${o.id}`, type: 'followup', label: `Follow-up due · ${name}`, sublabel: 'Scheduled follow-up has arrived', contactId: o.contactId, tone: 'warning' });
      }
      if (o.disposition === 're_engagement') {
        items.push({ id: `st-${o.id}`, type: 'stalled', label: `Stalled · ${name}`, sublabel: 'In re-engagement — needs a touch', contactId: o.contactId, tone: 'warning' });
      }
      if (o.stage === 'awareness' && o.disposition === 'active' && (o.workflowStage === 'lead_source' || o.workflowStage === 'lead')) {
        items.push({ id: `nr-${o.id}`, type: 'referral', label: `New lead · ${name}`, sublabel: 'Awaiting triage', contactId: o.contactId, tone: 'brand' });
      }
    }

    return NextResponse.json({ provisioned: true, count: items.length, items: items.slice(0, 20) });
  } catch (err) {
    // Bell should never break the app — degrade to empty.
    const res = crmError(err);
    if (res.status === 200) return res; // provisioned:false passthrough
    return NextResponse.json({ provisioned: true, count: 0, items: [] });
  }
}
