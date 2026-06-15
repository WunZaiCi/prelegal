import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror the tsconfig path alias ("@/*": ["./*"]).
    alias: {
      "@": resolve(rootDir, "."),
    },
  },
  test: {
    // jsdom for component tests; PDF rendering tests opt into node via a
    // per-file `// @vitest-environment node` pragma.
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
  },
});
