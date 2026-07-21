/**
 * POST /api/crm/contacts/export — contacts as CSV.
 *
 * POST rather than GET because the client sends the IDs it is currently
 * showing, so an export matches the filters and tab on screen exactly. With
 * 580 contacts a list of IDs is far past what a URL can carry.
 *
 * Server-side rather than building the CSV in the browser: the list view only
 * embeds a handful of fields, and an export that quietly omitted the referral
 * and PNFF detail would be worse than no export.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { supabaseAdmin } from '@/lib/supabase';
import { contactReadScope } from '@/lib/crm/access';

export const dynamic = 'force-dynamic';

/** Column header → database column. Order here is the column order out. */
const COLUMNS: [string, string][] = [
  ['Client Name', 'full_name'],
  ['Primary First Name', 'first_name'],
  ['Primary Last Name', 'last_name'],
  ['Secondary First Name', 'secondary_first_name'],
  ['Secondary Last Name', 'secondary_last_name'],
  ['Primary Email', 'email'],
  ['Secondary Email', 'secondary_email'],
  ['Primary Phone', 'mobile_phone'],
  ['Secondary Phone', 'secondary_phone'],
  ['Other Phone', 'phone'],
  ['Address Line 1', 'address_line1'],
  ['Address Line 2', 'address_line2'],
  ['City', 'city'],
  ['State', 'state'],
  ['Zip Code', 'zip_code'],
  ['Date of Birth', 'date_of_birth'],
  ['Matter Type', 'matter_type'],
  ['Status', 'status'],
  ['CC Fee Due', 'cc_fee_due'],
  ['Staff Contact', 'staff_contact'],
  ['Contact Type', 'last_contact_type'],
  ['Contact Date', 'contact_date'],
  ['Referral Date', 'referral_date'],
  ['Referred By', 'referral_source'],
  ['Referral Type', 'referral_type'],
  ['Attorney', 'attorney'],
  ['Send Follow Up Email', 'send_follow_up_email_at'],
  ['Email Follow Up', 'email_follow_up_at'],
  ['Final Email/Closure Notice', 'final_closure_notice_at'],
  ['Notes - Appointment - Focal', 'appointment_notes'],
  ['Notes', 'notes'],
  ['Status/Notes', 'status_notes'],
  ['Source', 'source'],
];

/**
 * RFC-4180 escaping, plus a leading apostrophe on anything a spreadsheet
 * would read as a formula. Without it a cell starting =, +, - or @ is
 * executed on open, which is how a CSV export becomes an attack on whoever
 * opens it.
 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;

  let ids: string[] | null = null;
  try {
    const body = (await req.json()) as { ids?: unknown };
    if (Array.isArray(body.ids) && body.ids.length > 0) ids = body.ids.map(String);
  } catch {
    // No body means "export everything I can see".
  }

  try {
    const scope = contactReadScope(gate.user);

    let query = supabaseAdmin
      .from('sig_contacts')
      .select(COLUMNS.map(([, col]) => col).join(', '))
      .order('full_name', { ascending: true })
      .limit(10000);
    if (scope.mode === 'assigned') query = query.eq('assigned_staff_id', scope.staffId);
    if (ids) query = query.in('id', ids);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    const lines = [
      COLUMNS.map(([label]) => csvCell(label)).join(','),
      ...rows.map((r) => COLUMNS.map(([, col]) => csvCell(r[col])).join(',')),
    ];

    // BOM so Excel opens UTF-8 names correctly rather than mangling accents.
    const csv = `﻿${lines.join('\r\n')}\r\n`;
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="cfs-contacts-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return crmError(err);
  }
}
