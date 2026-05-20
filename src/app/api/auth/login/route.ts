import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "sig360_session";
const SESSION_SECRET = process.env.SIG360_SESSION_SECRET || "";

const ADMIN_EMAIL = process.env.SIG360_ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.SIG360_ADMIN_PASSWORD || "";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    if (!SESSION_SECRET || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: "Auth is not configured" }, { status: 500 });
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, SESSION_SECRET, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
