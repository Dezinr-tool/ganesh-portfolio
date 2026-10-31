import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDashboardAuthToken,
  isDashboardAuthExempt,
  isDashboardLoginRedirect,
  isDashboardProtectedPath,
  verifyDashboardAuthCookie,
} from "@/app/dashboard/_lib/auth";
import {
  createMemoryVaultAuthToken,
  verifyMemoryVaultAuthCookie,
} from "@/lib/memory-vault-auth";
import {
  hasEaMiddlewareAuth,
  isValidEaTokenFormat,
  isValidLegacyEaAuthFormat,
} from "@/lib/ea-token-edge";
import { getEaSessionId, getEaSessionValue, verifyEaAuthCookie } from "@/lib/ea-auth";
import { clearSessionCookie, setSessionCookie } from "@/lib/ea-token-auth";
import { isBrainOwner, requireBrainOwner } from "@/lib/brain-owner-auth";
import { createMbAdminAuthToken, hasMbAdminAuth } from "@/lib/mb-admin-auth-edge";
import { cacheGet, cacheKey, cacheSet, hashString } from "@/lib/ai-cache";
import { phoneHref, splitEmailLines, splitLines } from "@/lib/content-utils";
import { hasAccess, isOnTrial, publicUser, rowToUser, type UserRow } from "@/lib/auth-types";
import { checkLimit, LIMITS, normalizePlan } from "@/lib/plan-limits";
import { currentMonthKey, monthLabel, shiftMonthKey } from "@/lib/expense-tracker-month";
import { isValidPaymentSignature } from "@/lib/razorpay";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("dashboard auth", () => {
  it("matches protected prefixes on segment boundaries only", () => {
    expect(isDashboardProtectedPath("/dashboard")).toBe(true);
    expect(isDashboardProtectedPath("/dashboard/invoices/1")).toBe(true);
    expect(isDashboardProtectedPath("/dashboarding")).toBe(false);
    expect(isDashboardProtectedPath("/tools-public")).toBe(false);
    expect(isDashboardProtectedPath("/")).toBe(false);
  });

  it("exempts the login pages from the redirect", () => {
    expect(isDashboardLoginRedirect("/dashboard/login")).toBe(false);
    expect(isDashboardLoginRedirect("/dashboard")).toBe(true);
    expect(isDashboardAuthExempt("/dashboard/login")).toBe(true);
    expect(isDashboardAuthExempt("/api/moodboard/admin/auth")).toBe(true);
    expect(isDashboardAuthExempt("/api/invoices")).toBe(false);
  });

  it("issues a stable SHA-256 token per password", async () => {
    const a = await createDashboardAuthToken("pw");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await createDashboardAuthToken("pw")).toBe(a);
    expect(await createDashboardAuthToken("other")).not.toBe(a);
  });

  it("verifies only the token for the configured password", async () => {
    vi.stubEnv("DASHBOARD_PASSWORD", "secret");
    expect(await verifyDashboardAuthCookie(await createDashboardAuthToken("secret"))).toBe(true);
    expect(await verifyDashboardAuthCookie(await createDashboardAuthToken("guess"))).toBe(false);
    expect(await verifyDashboardAuthCookie(undefined)).toBe(false);
  });

  it("fails closed when no password is configured", async () => {
    vi.stubEnv("DASHBOARD_PASSWORD", "");
    expect(await verifyDashboardAuthCookie(await createDashboardAuthToken(""))).toBe(false);
  });

  it("keeps vault tokens distinct from dashboard tokens for the same password", async () => {
    vi.stubEnv("MOODBOARD_MEMORY_PASSWORD", "same");
    const vault = await createMemoryVaultAuthToken("same");
    expect(vault).not.toBe(await createDashboardAuthToken("same"));
    expect(await verifyMemoryVaultAuthCookie(vault)).toBe(true);
    expect(await verifyMemoryVaultAuthCookie(await createDashboardAuthToken("same"))).toBe(false);
  });
});

describe("EA auth", () => {
  const token = "1b4e28ba-2fa1-11d2-883f-0016d3cca427-1b4e28ba-2fa1-11d2-883f-0016d3cca427";

  it("accepts only the double-UUID token shape at the edge", () => {
    expect(isValidEaTokenFormat(token)).toBe(true);
    expect(isValidEaTokenFormat(` ${token} `)).toBe(true);
    expect(isValidEaTokenFormat("1b4e28ba-2fa1-11d2-883f-0016d3cca427")).toBe(false);
    expect(isValidEaTokenFormat("")).toBe(false);
    expect(isValidEaTokenFormat(undefined)).toBe(false);
  });

  it("screens legacy cookies by length and charset", () => {
    expect(isValidLegacyEaAuthFormat("abcd1234")).toBe(true);
    expect(isValidLegacyEaAuthFormat("short")).toBe(false);
    expect(isValidLegacyEaAuthFormat("has space here")).toBe(false);
    expect(isValidLegacyEaAuthFormat("<script>x</script>")).toBe(false);
  });

  it("lets either cookie pass the middleware gate", () => {
    expect(hasEaMiddlewareAuth(token, undefined)).toBe(true);
    expect(hasEaMiddlewareAuth(undefined, "abcd1234")).toBe(true);
    expect(hasEaMiddlewareAuth("bad", "bad")).toBe(false);
  });

  it("verifies the legacy password cookie in both encodings", () => {
    vi.stubEnv("EA_PASSWORD", "p@ss word");
    const encoded = getEaSessionValue();
    expect(encoded).toBe(Buffer.from("p@ss word").toString("base64url"));
    expect(verifyEaAuthCookie(encoded)).toBe(true);
    expect(verifyEaAuthCookie("p@ss word")).toBe(true);
    expect(verifyEaAuthCookie("nope")).toBe(false);
    expect(getEaSessionId(encoded)).toBe(encoded);
    expect(getEaSessionId("nope")).toBeNull();
  });

  it("rejects everything when EA_PASSWORD is unset", () => {
    vi.stubEnv("EA_PASSWORD", "");
    expect(getEaSessionValue()).toBe("");
    expect(verifyEaAuthCookie("")).toBe(false);
    expect(verifyEaAuthCookie("anything")).toBe(false);
  });

  it("sets and clears an httpOnly 30-day session cookie", () => {
    const set = vi.fn();
    setSessionCookie({ cookies: { set } }, "tok");
    expect(set).toHaveBeenCalledWith("ea_token", "tok", expect.objectContaining({
      httpOnly: true, sameSite: "lax", path: "/", maxAge: 2592000,
    }));
    clearSessionCookie({ cookies: { set } });
    expect(set).toHaveBeenLastCalledWith("ea_token", "", expect.objectContaining({ maxAge: 0 }));
  });
});

describe("brain owner + moodboard admin", () => {
  const req = (token?: string) =>
    new NextRequest("http://localhost/api/x", { headers: token ? { "x-owner-token": token } : {} });

  it("requires the exact owner token header", async () => {
    vi.stubEnv("BRAIN_OWNER_TOKEN", "owner");
    expect(isBrainOwner(req("owner"))).toBe(true);
    expect(isBrainOwner(req("Owner"))).toBe(false);
    expect(requireBrainOwner(req("owner"))).toBeNull();
    expect(requireBrainOwner(req())?.status).toBe(401);
  });

  it("returns 503 when owner access is not configured", () => {
    vi.stubEnv("BRAIN_OWNER_TOKEN", "");
    expect(isBrainOwner(req(""))).toBe(false);
    expect(requireBrainOwner(req())?.status).toBe(503);
  });

  it("only accepts the admin token derived from the admin password", async () => {
    vi.stubEnv("EA_PASSWORD", "admin-pw");
    const token = await createMbAdminAuthToken("admin-pw");
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(await hasMbAdminAuth(token)).toBe(true);
    expect(await hasMbAdminAuth(await createMbAdminAuthToken("guess"))).toBe(false);
    expect(await hasMbAdminAuth(undefined)).toBe(false);
  });

  it("rejects the old forgeable 'true' admin cookie", async () => {
    vi.stubEnv("EA_PASSWORD", "admin-pw");
    expect(await hasMbAdminAuth("true")).toBe(false);
  });

  it("fails closed for admin when EA_PASSWORD is unset", async () => {
    vi.stubEnv("EA_PASSWORD", "");
    expect(await hasMbAdminAuth(await createMbAdminAuthToken(""))).toBe(false);
  });

  it("keeps admin tokens distinct from dashboard tokens", async () => {
    expect(await createMbAdminAuthToken("pw")).not.toBe(await createDashboardAuthToken("pw"));
  });
});

describe("razorpay signature", () => {
  it("accepts the HMAC of order|payment and nothing else", async () => {
    vi.stubEnv("RAZORPAY_KEY_SECRET", "s3cret");
    const { createHmac } = await import("node:crypto");
    const good = createHmac("sha256", "s3cret").update("o|p").digest("hex");
    expect(isValidPaymentSignature("o", "p", good)).toBe(true);
    expect(isValidPaymentSignature("o", "q", good)).toBe(false);
    expect(isValidPaymentSignature("o", "p", good.toUpperCase())).toBe(true);
    expect(isValidPaymentSignature("o", "p", "zz")).toBe(false);
    expect(isValidPaymentSignature("o", "p", "")).toBe(false);
  });
});

describe("ai cache", () => {
  it("joins key parts and skips blanks", () => {
    expect(cacheKey("a", undefined, "", 2, "b")).toBe("a::2::b");
  });

  it("returns values until they expire", () => {
    vi.useFakeTimers();
    cacheSet("k1", { v: 1 }, 1000);
    expect(cacheGet("k1")).toEqual({ v: 1 });
    vi.advanceTimersByTime(1001);
    expect(cacheGet("k1")).toBeNull();
  });

  it("evicts the oldest entry once full", () => {
    for (let i = 0; i < 201; i++) cacheSet(`evict-${i}`, i);
    expect(cacheGet("evict-0")).toBeNull();
    expect(cacheGet("evict-200")).toBe(200);
  });

  it("hashes deterministically", () => {
    expect(hashString("hello")).toBe(hashString("hello"));
    expect(hashString("hello")).not.toBe(hashString("hellp"));
    expect(hashString("")).toBe("0");
  });
});

describe("content utils", () => {
  it("splits text into trimmed lines with a fallback", () => {
    expect(splitLines(" a \n\n b ", ["x"])).toEqual(["a", "b"]);
    expect(splitLines("  ", ["x"])).toEqual(["x"]);
    expect(splitLines(undefined, [])).toEqual([]);
  });

  it("splits an email after the @", () => {
    expect(splitEmailLines("hello@designbyganesh.com")).toEqual(["hello@", "designbyganesh.com"]);
    expect(splitEmailLines("nope")).toEqual(["nope", ""]);
  });

  it("builds tel: links with the +91 country code", () => {
    expect(phoneHref("98765 43210")).toBe("tel:+919876543210");
    expect(phoneHref("+91 98765 43210")).toBe("tel:+919876543210");
    expect(phoneHref("abc")).toBe("tel:abc");
  });

  it("adds +91 to a 10-digit mobile that happens to start with 91", () => {
    expect(phoneHref("91234 56789")).toBe("tel:+919123456789");
  });
});

describe("users and plans", () => {
  const row: UserRow = {
    id: "u1",
    email: "a@x.test",
    name: null,
    password_hash: "hash",
    plan: "",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_status: "trialing",
    trial_ends_at: new Date("2030-01-01T00:00:00Z"),
    onboarding_completed: false,
    created_at: "2026-01-01T00:00:00.000Z",
    last_seen_at: new Date("2026-02-01T00:00:00Z"),
  };

  it("maps rows to users and defaults the plan to pro", () => {
    const user = rowToUser(row);
    expect(user.plan).toBe("pro");
    expect(user.trialEndsAt).toBe("2030-01-01T00:00:00.000Z");
    expect(user.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("never exposes the password hash or Stripe ids publicly", () => {
    const pub = publicUser(rowToUser(row)) as Record<string, unknown>;
    expect(pub).not.toHaveProperty("password_hash");
    expect(pub).not.toHaveProperty("passwordHash");
    expect(pub).not.toHaveProperty("stripeCustomerId");
  });

  it("knows whether the trial is still running", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2029-12-31T00:00:00Z"));
    expect(isOnTrial(rowToUser(row))).toBe(true);
    vi.setSystemTime(new Date("2030-01-02T00:00:00Z"));
    expect(isOnTrial(rowToUser(row))).toBe(false);
    expect(hasAccess(rowToUser(row))).toBe(true);
  });

  it("treats every plan as unlimited while billing is disabled", () => {
    expect(normalizePlan("free")).toBe("pro");
    expect(checkLimit("free", "messagesPerDay", 9999)).toEqual({ allowed: true, limit: -1, usage: 9999 });
    expect(LIMITS.free.messagesPerDay).toBe(20);
  });
});

describe("expense month keys", () => {
  it("formats and shifts months across year boundaries", () => {
    expect(currentMonthKey(new Date(2026, 0, 31))).toBe("2026-01");
    expect(shiftMonthKey("2026-01", -1)).toBe("2025-12");
    expect(shiftMonthKey("2025-12", 1)).toBe("2026-01");
    expect(shiftMonthKey("2026-03", 12)).toBe("2027-03");
    expect(monthLabel("2026-10")).toBe("October 2026");
  });
});
