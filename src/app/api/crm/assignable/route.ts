import { NextResponse } from 'next/server';
import { guardPermission } from '@/lib/rbac/route-guards';
import { PERMISSIONS, ROLE_LABELS, type Role } from '@/lib/rbac';
import { supabaseAdmin } from '@/lib/supabase';

type Row = Record<string, unknown>;

/**
 * GET /api/crm/assignable — internal staff eligible to be assigned as an
 * advisor/planner on a client. Guarded by clients.assign_advisors.
 */
export async function GET() {
  const gate = await guardPermission(PERMISSIONS.CLIENTS_ASSIGN_ADVISORS);
  if (gate.response) return gate.response;

  try {
    const { data, error } = await supabaseAdmin
      .from('sig_profiles')
      .select('id, display_name, first_name, last_name, email, role')
      .eq('is_internal_user', true)
      .eq('status', 'active')
      .order('display_name', { ascending: true });
    if (error) {
      if (error.code === '42P01') return NextResponse.json({ staff: [] });
      throw new Error(error.message);
    }
    const staff = ((data ?? []) as Row[]).map((p) => {
      const name =
        (p.display_name as string) ||
        `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() ||
        (p.email as string) ||
        'Unnamed';
      return {
        id: String(p.id),
        name,
        roleLabel: ROLE_LABELS[p.role as Role] ?? String(p.role ?? ''),
      };
    });
    return NextResponse.json({ staff });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
