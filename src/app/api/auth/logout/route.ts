import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, isSupabaseAuthConfigured } from "@/lib/supabase-server";

const SESSION_COOKIE = "sig360_session";

export async function POST() {
  // Clear the legacy admin cookie.
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);

  // Clear any Supabase Auth session.
  if (isSupabaseAuthConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // ignore — cookie removal above is sufficient
    }
  }

  return NextResponse.json({ success: true });
}
