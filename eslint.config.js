import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
  js.configs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      "no-undef": "off",
    },
  },
]);
