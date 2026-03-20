import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./tests/component/setup.ts"],
    include: ["tests/component/**/*.test.ts?(x)"],
    restoreMocks: true,
    clearMocks: true,
  },
});
