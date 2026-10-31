import { NextRequest } from "next/server";
import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";
import { config, proxy } from "@/proxy";
import {
  createDashboardAuthToken,
  DASHBOARD_AUTH_COOKIE,
  DASHBOARD_PROTECTED_PREFIXES,
} from "@/app/dashboard/_lib/auth";
import {
  createMemoryVaultAuthToken,
  MEMORY_VAULT_AUTH_COOKIE,
} from "@/lib/memory-vault-auth";
import { EA_TOKEN_COOKIE } from "@/lib/ea-token-edge";
import { createMbAdminAuthToken, MB_ADMIN_AUTH_COOKIE } from "@/lib/mb-admin-auth-edge";

const ORIGIN = "http://localhost:3000";

function request(path: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(`${ORIGIN}${path}`);
  for (const [name, value] of Object.entries(cookies)) req.cookies.set(name, value);
  return req;
}

async function dashboardCookie() {
  return {
    [DASHBOARD_AUTH_COOKIE]: await createDashboardAuthToken(process.env.DASHBOARD_PASSWORD!),
  };
}

function matches(url: string) {
  return unstable_doesMiddlewareMatch({ config, nextConfig, url });
}

describe("proxy matcher", () => {
  it.each(DASHBOARD_PROTECTED_PREFIXES.map((p) => [p]))(
    "runs on protected prefix %s and its sub-paths",
    (prefix) => {
      expect(matches(prefix)).toBe(true);
      expect(matches(`${prefix}/anything`)).toBe(true);
    },
  );

  it.each([["/api/projects"], ["/api/projects/123"]])(
    "protects the projects API (%s) like the projects dashboard",
    (path) => {
      expect(matches(path)).toBe(true);
    },
  );

  it.each([["/"], ["/work/some-case-study"], ["/sign/abc"], ["/api/webhooks/stripe"]])(
    "leaves public path %s alone",
    (path) => {
      expect(matches(path)).toBe(false);
    },
  );
});

describe("proxy dashboard gate", () => {
  it.each(DASHBOARD_PROTECTED_PREFIXES.filter((p) => p.startsWith("/api/")).map((p) => [p]))(
    "returns 401 JSON for unauthenticated API %s",
    async (path) => {
      const res = await proxy(request(path));
      expect(res.status).toBe(401);
      await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    },
  );

  it("returns 401 for the unauthenticated projects API", async () => {
    const res = await proxy(request("/api/projects"));
    expect(res.status).toBe(401);
  });

  it("redirects unauthenticated pages to login with a from param", async () => {
    const res = await proxy(request("/expense-tracker"));
    expect(getRedirectUrl(res)).toBe(`${ORIGIN}/dashboard/login?from=%2Fexpense-tracker`);
  });

  it("rejects a forged dashboard cookie", async () => {
    const res = await proxy(request("/api/invoices", { [DASHBOARD_AUTH_COOKIE]: "forged" }));
    expect(res.status).toBe(401);
  });

  it("lets an authenticated request through", async () => {
    const res = await proxy(request("/api/invoices", await dashboardCookie()));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("sends a logged-in user away from the login page", async () => {
    const res = await proxy(request("/dashboard/login", await dashboardCookie()));
    expect(getRedirectUrl(res)).toBe(`${ORIGIN}/dashboard`);
  });
});

describe("proxy EA gate", () => {
  it("returns 401 for EA API without a session", async () => {
    const res = await proxy(request("/api/ea/chat"));
    expect(res.status).toBe(401);
  });

  it("redirects EA pages to the EA login", async () => {
    const res = await proxy(request("/ea/chat"));
    expect(getRedirectUrl(res)).toBe(`${ORIGIN}/ea/login`);
  });

  it.each([["/api/ea/login"], ["/api/ea/signup"], ["/api/ea/auth"], ["/ea/privacy"], ["/ea/terms"]])(
    "keeps %s public",
    async (path) => {
      const res = await proxy(request(path));
      expect(res.headers.get("x-middleware-next")).toBe("1");
    },
  );

  it("passes a well-formed EA token through to the route for full validation", async () => {
    const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
    const res = await proxy(request("/api/ea/chat", { [EA_TOKEN_COOKIE]: token }));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});

describe("proxy moodboard admin gate", () => {
  it("sends a forged 'true' admin cookie to the admin login", async () => {
    const res = await proxy(
      request("/moodboard/admin", { ...(await dashboardCookie()), [MB_ADMIN_AUTH_COOKIE]: "true" }),
    );
    expect(getRedirectUrl(res)).toBe(`${ORIGIN}/moodboard/admin/login?from=%2Fmoodboard%2Fadmin`);
  });

  it("returns 401 for the admin API with a forged cookie", async () => {
    const res = await proxy(
      request("/api/moodboard/admin/sessions", { ...(await dashboardCookie()), [MB_ADMIN_AUTH_COOKIE]: "true" }),
    );
    expect(res.status).toBe(401);
  });

  it("lets a real admin token through", async () => {
    const token = await createMbAdminAuthToken(process.env.EA_PASSWORD!);
    const res = await proxy(
      request("/moodboard/admin", { ...(await dashboardCookie()), [MB_ADMIN_AUTH_COOKIE]: token }),
    );
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});

describe("proxy memory vault gate", () => {
  it("returns 401 for the vault API without the vault cookie", async () => {
    const res = await proxy(request("/api/memory-vault"));
    expect(res.status).toBe(401);
  });

  it("does not accept the dashboard cookie for the vault", async () => {
    const res = await proxy(request("/api/memory-vault", await dashboardCookie()));
    expect(res.status).toBe(401);
  });

  it("accepts the vault cookie", async () => {
    const token = await createMemoryVaultAuthToken(process.env.MOODBOARD_MEMORY_PASSWORD!);
    const res = await proxy(request("/api/memory-vault", { [MEMORY_VAULT_AUTH_COOKIE]: token }));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
