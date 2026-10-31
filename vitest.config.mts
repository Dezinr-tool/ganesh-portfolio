import path from "node:path";
import { defineConfig } from "vitest/config";

const root = path.resolve(__dirname);

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${root}/` },
      // `server-only` throws outside a React Server Component bundle.
      { find: /^server-only$/, replacement: `${root}/tests/setup/server-only.ts` },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/{unit,integration}/**/*.test.{ts,tsx}", "lib/**/__tests__/**/*.test.ts"],
    setupFiles: ["tests/setup/env.ts"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["lib/**", "app/api/**", "app/dashboard/_lib/**", "proxy.ts", "src/lib/**"],
      reporter: ["text-summary", "html"],
    },
  },
});
