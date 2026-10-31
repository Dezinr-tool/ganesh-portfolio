import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("email modules without RESEND_API_KEY", () => {
  it.each([["@/lib/email"], ["@/lib/email-service"]])(
    "%s can be imported (so `next build` works without the key)",
    async (mod) => {
      vi.stubEnv("RESEND_API_KEY", "");
      await expect(import(mod)).resolves.toBeDefined();
    },
  );

  it("fails at send time with a clear message", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { sendSignedConfirmationToGanesh } = await import("@/lib/email");
    await expect(sendSignedConfirmationToGanesh("T", "C", "Co")).rejects.toThrow(/RESEND_API_KEY/);
  });
});
