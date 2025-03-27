import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [], // Don't extend any configs
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Disable all ESLint and plugin rules by setting them to "off"
      ...Object.fromEntries(
        Object.keys(js.configs.recommended.rules).map((key) => [key, "off"])
      ),
      ...Object.fromEntries(
        Object.keys(reactHooks.configs.recommended.rules).map((key) => [
          key,
          "off",
        ])
      ),
      ...Object.fromEntries(
        Object.keys(tseslint.configs.recommended.rules).map((key) => [
          key,
          "off",
        ])
      ),
    },
  }
);
