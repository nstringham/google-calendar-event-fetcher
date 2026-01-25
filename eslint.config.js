import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import ts from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
  js.configs.recommended,
  ts.configs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      "no-undef": "off",
      curly: "error",
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
]);
