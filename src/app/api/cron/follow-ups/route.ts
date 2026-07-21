/**
 * GET|POST /api/cron/follow-ups — send due follow-up reminders.
 *
 * Point a scheduler at this (Coolify cron, GitHub Actions, cron-job.org).
 * Safe to call as often as you like: each follow-up is stamped `reminded_at`
 * the moment its reminder goes out, so nobody gets nudged twice.
 *
 * Protected by CRON_SECRET when set — otherwise it falls back to requiring a
 * signed-in user, so this can never become an open send-email endpoint.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionIdentity } from '@/lib/rbac/current-user';
import { supabaseAdmin } from '@/lib/supabase';
import { dueReminders, markReminded } from '@/lib/followups/followups';

export const dynamic = 'force-dynamic';

const METHOD_LABELS: Record<string, string> = {
  phone: 'phone call',
  email: 'email',
  sms: 'text message',
  meeting_in_person: 'in-person meeting',
  meeting_video: 'video meeting',
  mail: 'physical mail',
  task: 'task',
};

async function authorize(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get('authorization') || '';
    if (header === `Bearer ${secret}`) return true;
    if (req.nextUrl.searchParams.get('secret') === secret) return true;
    return false;
  }
  return Boolean(await getSessionIdentity());
}

export async function GET(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  let due;
  try {
    due = await dueReminders(100);
  } catch (err) {
    // Before the migration is applied this table does not exist; that is not
    // an outage worth paging anyone about.
    return NextResponse.json({ sent: 0, skipped: 0, error: (err as Error).message }, { status: 200 });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  let sent = 0;
  const failures: string[] = [];

  for (const item of due) {
    // Who to nudge — the assignee's own email/phone from their profile.
    const { data: profile } = await supabaseAdmin
      .from('sig_profiles')
      .select('email, mobile_phone, first_name')
      .eq('id', item.assignedTo ?? '')
      .maybeSingle();
    const who = profile as { email?: string; mobile_phone?: string; first_name?: string } | null;

    const method = METHOD_LABELS[item.contactMethod] ?? item.contactMethod;
    const subject = item.subject || `Follow up with ${item.contactName ?? 'a contact'}`;
    const link = item.contactId && appUrl ? `${appUrl}/contacts/${item.contactId}` : '';
    const body =
      `${subject}\n\n` +
      `Due: ${new Date(item.dueAt).toLocaleString('en-US')}\n` +
      `How: ${method}\n` +
      (item.contactName ? `Who: ${item.contactName}\n` : '') +
      (item.notes ? `\nNotes: ${item.notes}\n` : '') +
      (link ? `\n${link}\n` : '');

    try {
      const wantsEmail = item.remindChannel === 'email' || item.remindChannel === 'both';
      const wantsSms = item.remindChannel === 'sms' || item.remindChannel === 'both';

      if (wantsEmail && who?.email) {
        await fetch(`${appUrl}/api/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: who.email, subject: `Follow-up due: ${subject}`, text: body }),
        });
      }
      if (wantsSms && who?.mobile_phone) {
        await fetch(`${appUrl}/api/sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: who.mobile_phone, body: `${subject} — due ${new Date(item.dueAt).toLocaleString('en-US')}` }),
        });
      }
      // Stamped even when the assignee has no email or phone on file:
      // otherwise every run would retry the same undeliverable reminder.
      await markReminded(item.id);
      sent++;
    } catch (err) {
      failures.push(`${item.id}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({ due: due.length, sent, failures });
}

export const POST = GET;
