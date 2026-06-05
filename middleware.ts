import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DASHBOARD_AUTH_COOKIE,
  verifyDashboardAuthCookie,
} from "./app/dashboard/_lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(DASHBOARD_AUTH_COOKIE)?.value;
  const isAuthed = await verifyDashboardAuthCookie(cookie);

  const requiresAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/invoices") ||
    pathname.startsWith("/api/agreements") ||
    pathname.startsWith("/api/settings");

  if (pathname.startsWith("/dashboard/login")) {
    if (isAuthed) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (requiresAuth && !isAuthed) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/dashboard/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/invoices/:path*",
    "/api/agreements/:path*",
    "/api/settings",
  ],
};
