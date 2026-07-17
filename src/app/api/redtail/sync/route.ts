import { NextResponse } from 'next/server';
import { guardPermission } from '@/lib/rbac/route-guards';
import { PERMISSIONS } from '@/lib/rbac';
import { runRedtailSync } from '@/lib/redtail-sync';

// A full sync paginates the Redtail API; give it room.
export const maxDuration = 300;

/** POST /api/redtail/sync — trigger a full Redtail → SIG360 mirror sync. */
export async function POST() {
  const gate = await guardPermission(PERMISSIONS.SETTINGS_MANAGE_INTEGRATIONS);
  if (gate.response) return gate.response;

  const result = await runRedtailSync(gate.user.id);
  const status = result.status === 'error' ? 502 : 200;
  return NextResponse.json(result, { status });
}
