import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    coverage: {
      provider: "v8",
      reportOnFailure: true,
      thresholds: {
        100: true,
      },
    },
    browser: {
      provider: playwright(),
      instances: [{ browser: "chromium" }, { browser: "firefox" }, { browser: "webkit" }],
    },
  },
});
