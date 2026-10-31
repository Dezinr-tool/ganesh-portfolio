import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
  }),
}));

const authService = vi.hoisted(() => ({ verifyUser: vi.fn() }));
const sessionService = vi.hoisted(() => ({ createSession: vi.fn() }));
vi.mock("@/lib/auth-service", () => authService);
vi.mock("@/lib/session-service", () => sessionService);

const { POST: mbAdminLogin } = await import("@/app/api/moodboard/admin/auth/route");
const { POST: vaultLogin } = await import("@/app/api/memory-vault/auth/route");
const { POST: eaLogin } = await import("@/app/api/ea/login/route");
const { requireMbAdmin } = await import("@/lib/mb-admin-auth");
const { createMbAdminAuthToken } = await import("@/lib/mb-admin-auth-edge");
const { verifyMemoryVaultAuthCookie } = await import("@/lib/memory-vault-auth");

const post = (body: unknown) =>
  new NextRequest("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

beforeEach(() => {
  cookieJar.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/moodboard/admin/auth", () => {
  it("rejects a wrong password without setting a cookie", async () => {
    const res = await mbAdminLogin(post({ password: "wrong" }));
    expect(res.status).toBe(401);
    expect(res.cookies.get("mb_admin_auth")).toBeUndefined();
  });

  it("sets an unforgeable admin token on success", async () => {
    const res = await mbAdminLogin(post({ password: process.env.EA_PASSWORD }));
    expect(res.status).toBe(200);
    const cookie = res.cookies.get("mb_admin_auth");
    expect(cookie?.value).toBe(await createMbAdminAuthToken(process.env.EA_PASSWORD!));
    expect(cookie?.httpOnly).toBe(true);
  });

  it("only redirects back to allow-listed admin paths", async () => {
    const ok = await mbAdminLogin(post({ password: process.env.EA_PASSWORD, from: "/tools/x" }));
    await expect(ok.json()).resolves.toMatchObject({ redirect: "/tools/x" });
    const evil = await mbAdminLogin(post({ password: process.env.EA_PASSWORD, from: "https://evil.test" }));
    await expect(evil.json()).resolves.toMatchObject({ redirect: "/moodboard/admin" });
  });

  it("returns 500 for malformed JSON", async () => {
    const res = await mbAdminLogin(post("{"));
    expect(res.status).toBe(500);
  });
});

describe("requireMbAdmin", () => {
  it("denies the forged 'true' cookie", async () => {
    cookieJar.set("mb_admin_auth", "true");
    expect((await requireMbAdmin())?.status).toBe(401);
  });

  it("allows the real admin token", async () => {
    cookieJar.set("mb_admin_auth", await createMbAdminAuthToken(process.env.EA_PASSWORD!));
    expect(await requireMbAdmin()).toBeNull();
  });
});

describe("POST /api/memory-vault/auth", () => {
  it("rejects a wrong password", async () => {
    const res = await vaultLogin(post({ password: "nope" }));
    expect(res.status).toBe(401);
  });

  it("sets a vault cookie the proxy will accept", async () => {
    const res = await vaultLogin(post({ password: process.env.MOODBOARD_MEMORY_PASSWORD }));
    expect(res.status).toBe(200);
    expect(await verifyMemoryVaultAuthCookie(res.cookies.get("memory_vault_auth")?.value)).toBe(true);
  });
});

describe("POST /api/ea/login", () => {
  it("requires email and password", async () => {
    const res = await eaLogin(post({ email: " ", password: "" }));
    expect(res.status).toBe(400);
    expect(authService.verifyUser).not.toHaveBeenCalled();
  });

  it("rejects bad credentials with a generic message", async () => {
    authService.verifyUser.mockResolvedValue(null);
    const res = await eaLogin(post({ email: "a@x.test", password: "bad" }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Invalid email or password." });
  });

  it("creates a session cookie for valid credentials", async () => {
    authService.verifyUser.mockResolvedValue({ id: "u1" });
    sessionService.createSession.mockResolvedValue("tok-123");
    const res = await eaLogin(post({ email: " a@x.test ", password: "good" }));
    expect(authService.verifyUser).toHaveBeenCalledWith("a@x.test", "good");
    expect(res.status).toBe(200);
    expect(res.cookies.get("ea_token")?.value).toBe("tok-123");
  });

  it("returns 500 when the session store fails", async () => {
    authService.verifyUser.mockResolvedValue({ id: "u1" });
    sessionService.createSession.mockRejectedValue(new Error("db down"));
    const res = await eaLogin(post({ email: "a@x.test", password: "good" }));
    expect(res.status).toBe(500);
  });
});
