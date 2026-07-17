import { NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { listSequences } from '@/lib/crm/sequences';

/** GET /api/crm/sequences — configurable follow-up cadences. */
export async function GET() {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  try {
    const sequences = await listSequences();
    return NextResponse.json({ provisioned: true, sequences });
  } catch (err) {
    return crmError(err);
  }
}
