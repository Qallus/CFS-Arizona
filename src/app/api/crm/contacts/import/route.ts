import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { bulkCreateContacts } from '@/lib/crm/import';
import type { ContactInput } from '@/lib/crm/contacts';

const MAX_ROWS = 5000;

/** POST /api/crm/contacts/import — bulk-create contacts (+ Awareness opportunity). */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;

  let body: { rows?: ContactInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) {
    return NextResponse.json({ error: 'No rows to import.' }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Too many rows (max ${MAX_ROWS}).` }, { status: 400 });
  }

  try {
    const result = await bulkCreateContacts(gate.user, rows);
    return NextResponse.json(result);
  } catch (err) {
    return crmError(err);
  }
}
