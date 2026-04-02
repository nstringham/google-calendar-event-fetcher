import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "unicorn", "oxc"],
  options: { typeAware: true },
  categories: {
    correctness: "error",
    suspicious: "error",
    perf: "error",
  },
  rules: {
    curly: "error",
    eqeqeq: ["error", "smart"],
  },
});
