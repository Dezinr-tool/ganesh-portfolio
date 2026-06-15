import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DASHBOARD_AUTH_COOKIE,
  verifyDashboardAuthCookie,
} from "./app/dashboard/_lib/auth";
import {
  EA_AUTH_COOKIE,
  EA_TOKEN_COOKIE,
  hasEaMiddlewareAuth,
} from "./lib/ea-token-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(DASHBOARD_AUTH_COOKIE)?.value;
  const isAuthed = await verifyDashboardAuthCookie(cookie);

  const eaToken = request.cookies.get(EA_TOKEN_COOKIE)?.value;
  const eaCookie = request.cookies.get(EA_AUTH_COOKIE)?.value;
  const isEaAuthed = hasEaMiddlewareAuth(eaToken, eaCookie);

  if (pathname.startsWith("/ea/login") || pathname.startsWith("/ea/signup")) {
    if (isEaAuthed) {
      return NextResponse.redirect(new URL("/ea/chat", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/ea/privacy" || pathname === "/ea/terms") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/ea") || pathname.startsWith("/api/ea")) {
    if (pathname === "/api/ea/auth") {
      return NextResponse.next();
    }
    if (pathname === "/api/ea/login" || pathname === "/api/ea/signup") {
      return NextResponse.next();
    }
    if (pathname === "/api/ea/settings" && request.method === "GET") {
      return NextResponse.next();
    }
    if (pathname === "/api/ea/calendar/callback") {
      return NextResponse.next();
    }
    if (pathname === "/api/ea/calendar/oauth-config") {
      return NextResponse.next();
    }
    if (!isEaAuthed) {
      if (pathname.startsWith("/api/ea")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/ea/login", request.url));
    }
  }

  const requiresAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/invoices") ||
    pathname.startsWith("/api/agreements") ||
    pathname.startsWith("/api/settings") ||
    pathname.startsWith("/api/dashboard");

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

  if (pathname.startsWith("/moodboard/admin") || pathname.startsWith("/api/moodboard/admin")) {
    if (!isEaAuthed) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (pathname !== "/moodboard/admin") {
        return NextResponse.redirect(new URL("/moodboard/admin", request.url));
      }
    }
  }

  if (pathname.startsWith("/knowledge-admin") || pathname.startsWith("/api/knowledge")) {
    if (!isEaAuthed) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (pathname !== "/knowledge-admin") {
        return NextResponse.redirect(new URL("/knowledge-admin", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/ea/:path*",
    "/api/ea/:path*",
    "/moodboard/admin",
    "/moodboard/admin/:path*",
    "/api/moodboard/admin/:path*",
    "/knowledge-admin",
    "/knowledge-admin/:path*",
    "/api/knowledge/:path*",
    "/dashboard/:path*",
    "/api/invoices/:path*",
    "/api/agreements/:path*",
    "/api/settings",
    "/api/dashboard/:path*",
  ],
};
