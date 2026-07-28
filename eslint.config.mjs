import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import i18nextPlugin from "eslint-plugin-i18next";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      i18next: i18nextPlugin,
    },
    rules: {
      "i18next/no-literal-string": ["error", { 
        markupOnly: true, 
        ignoreAttribute: ["className", "href", "type", "id", "name", "role", "d", "viewBox", "xmlns", "cx", "cy", "r", "stroke", "fill", "strokeWidth", "strokeLinecap", "strokeLinejoin", "lang", "htmlFor", "target", "rel", "data-active", "data-expanded", "variant", "size"] 
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
