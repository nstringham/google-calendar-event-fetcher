import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    typecheck: {
      enabled: true,
      include: ["src/**/*.test.js"],
      tsconfig: "tsconfig.test.json",
    },
  },
});
