import { cookies } from "next/headers";

// Simple auth - just a session cookie
const SESSION_COOKIE = "sig360_session";
const SESSION_SECRET = process.env.SIG360_SESSION_SECRET || "";

export const ADMIN_USER = {
  email: process.env.SIG360_ADMIN_EMAIL || "",
  password: process.env.SIG360_ADMIN_PASSWORD || "",
  name: process.env.SIG360_ADMIN_NAME || "Admin",
};

export async function login(email: string, password: string): Promise<boolean> {
  if (!SESSION_SECRET || !ADMIN_USER.email || !ADMIN_USER.password) {
    return false;
  }

  if (email === ADMIN_USER.email && password === ADMIN_USER.password) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, SESSION_SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return true;
  }
  return false;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  if (!SESSION_SECRET) {
    return false;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return session?.value === SESSION_SECRET;
}

export async function getSession(): Promise<{ user: { name: string; email: string } } | null> {
  const authed = await isAuthenticated();
  if (authed) {
    return {
      user: {
        name: ADMIN_USER.name,
        email: ADMIN_USER.email,
      },
    };
  }
  return null;
}

// For compatibility with existing code that imports 'auth'
export const auth = getSession;
