import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "sig360_session";
const SESSION_SECRET = process.env.SIG360_SESSION_SECRET || "";

export function middleware(req: NextRequest) {
  const session = req.cookies.get(SESSION_COOKIE);
  const isLoggedIn = session?.value === SESSION_SECRET;
  
  const pathname = req.nextUrl.pathname;
  
  // Public routes - no auth needed
  const publicRoutes = [
    "/login",
    "/api/auth",
    "/api/twilio",
    "/api/sms/incoming",
    "/api/sms/status", 
    "/api/square/webhook",
    "/card/",
    "/scratch/",
    "/api/products/punch-cards/customer/",
    "/api/products/scratch-cards",
    "/api/products/business-cards",
    "/uploads/",
    "/api/uploads/",
    "/advertising/public",
    "/portal/",
    "/api/portal/",
  ];
  
  // Check if current path matches any public route
  const isPublic = publicRoutes.some(route => pathname.startsWith(route));
  
  if (isPublic) {
    const response = NextResponse.next();
    // Allow iframes for card pages
    if (pathname.startsWith("/card/") || pathname.startsWith("/scratch/")) {
      response.headers.delete("X-Frame-Options");
      response.headers.set("Content-Security-Policy", "frame-ancestors *");
    }
    return response;
  }
  
  // If on login and already logged in, go to dashboard
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
  
  // If not logged in, redirect to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
