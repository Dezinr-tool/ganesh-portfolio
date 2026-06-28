import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DASHBOARD_AUTH_COOKIE,
  isDashboardAuthExempt,
  isDashboardProtectedPath,
  verifyDashboardAuthCookie,
} from "./app/dashboard/_lib/auth";
import {
  EA_AUTH_COOKIE,
  EA_TOKEN_COOKIE,
  hasEaMiddlewareAuth,
} from "./lib/ea-token-edge";
import {
  MB_ADMIN_AUTH_COOKIE,
  hasMbAdminAuth,
} from "./lib/mb-admin-auth-edge";

const MB_ADMIN_LOGIN = "/moodboard/admin/login";

function mbAdminLoginUrl(request: NextRequest, from?: string) {
  const loginUrl = new URL(MB_ADMIN_LOGIN, request.url);
  if (from) loginUrl.searchParams.set("from", from);
  return loginUrl;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sanity Studio handles its own auth — never gate /studio behind app middleware.
  if (pathname.startsWith("/studio")) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(DASHBOARD_AUTH_COOKIE)?.value;
  const isAuthed = await verifyDashboardAuthCookie(cookie);

  const eaToken = request.cookies.get(EA_TOKEN_COOKIE)?.value;
  const eaCookie = request.cookies.get(EA_AUTH_COOKIE)?.value;
  const isEaAuthed = hasEaMiddlewareAuth(eaToken, eaCookie);
  const mbAdminCookie = request.cookies.get(MB_ADMIN_AUTH_COOKIE)?.value;
  const isMbAdminAuthed = hasMbAdminAuth(mbAdminCookie);

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

  if (pathname.startsWith("/dashboard/login")) {
    if (isAuthed) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const requiresAuth =
    isDashboardProtectedPath(pathname) && !isDashboardAuthExempt(pathname);

  if (requiresAuth && !isAuthed) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/dashboard/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === MB_ADMIN_LOGIN) {
    if (isMbAdminAuthed) {
      const from = request.nextUrl.searchParams.get("from");
      const dest =
        from &&
        (from.startsWith("/moodboard/admin") ||
          from.startsWith("/moodboard/sessions"))
          ? from
          : "/moodboard/admin";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/api/moodboard/admin/auth") {
    return NextResponse.next();
  }

  const requiresMbAdmin =
    pathname.startsWith("/moodboard/admin") ||
    pathname.startsWith("/api/moodboard/admin");

  if (requiresMbAdmin && !isMbAdminAuthed) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(mbAdminLoginUrl(request, pathname));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/ea/:path*",
    "/api/ea/:path*",
    "/moodboard/admin",
    "/moodboard/admin/:path*",
    "/moodboard",
    "/moodboard/:path*",
    "/api/moodboard/:path*",
    "/tools",
    "/tools/:path*",
    "/design-audit",
    "/design-audit/:path*",
    "/ia/:path*",
    "/wireframe/:path*",
    "/knowledge-admin",
    "/knowledge-admin/:path*",
    "/zoox-demo",
    "/zoox-demo/:path*",
    "/max/:path*",
    "/api/knowledge/:path*",
    "/api/design-audit/:path*",
    "/api/ia/:path*",
    "/api/wireframe/:path*",
    "/api/pre-generation/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/api/invoices/:path*",
    "/api/agreements/:path*",
    "/api/clients/:path*",
    "/api/settings",
    "/api/dashboard/:path*",
  ],
};
