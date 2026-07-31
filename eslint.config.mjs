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
      // Translation coverage is still being migrated. Keep new/existing
      // literals visible without making the entire lint gate unusable.
      "i18next/no-literal-string": [
        "warn",
        {
          markupOnly: true,
          ignoreAttribute: [
            "className",
            "href",
            "type",
            "id",
            "name",
            "role",
            "d",
            "viewBox",
            "xmlns",
            "cx",
            "cy",
            "r",
            "stroke",
            "fill",
            "strokeWidth",
            "strokeLinecap",
            "strokeLinejoin",
            "lang",
            "htmlFor",
            "target",
            "rel",
            "data-active",
            "data-expanded",
            "variant",
            "size",
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "agent/dist/**",
    "lovable/**",
    "scripts/extract-strings.js",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
