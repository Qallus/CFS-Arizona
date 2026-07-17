import { NextResponse } from 'next/server';
import { guardPermission } from '@/lib/rbac/route-guards';
import { PERMISSIONS } from '@/lib/rbac';
import { getRedtailStatus } from '@/lib/redtail-sync';

/** GET /api/redtail/status — config, last sync run, and mirror row counts. */
export async function GET() {
  const gate = await guardPermission(PERMISSIONS.SETTINGS_VIEW);
  if (gate.response) return gate.response;

  const status = await getRedtailStatus();
  return NextResponse.json(status);
}
