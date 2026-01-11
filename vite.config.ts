import { defineConfig } from "vitest/config";
import dts from "unplugin-dts/vite";

export default defineConfig({
  plugins: [dts({ exclude: "**/*.test.ts" })],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
      },
      formats: ["es"],
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reportOnFailure: true,
      thresholds: {
        100: true,
      },
    },
  },
});
