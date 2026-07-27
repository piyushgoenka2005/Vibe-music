import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Intentional unused API params / reserved hooks (free-shipping stubs, etc.)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ["src/gp9/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
  {
    files: [
      "src/components/checkout/**/*.{ts,tsx}",
      "src/components/compare/**/*.{ts,tsx}",
      "src/components/product/**/*.{ts,tsx}",
      "src/components/homepage/**/*.{ts,tsx}",
      "src/components/home/**/*.{ts,tsx}",
      "src/components/layout/**/*.{ts,tsx}",
      "src/components/search/**/*.{ts,tsx}",
      "src/components/cart/**/*.{ts,tsx}",
      "src/app/admin/**/*.{ts,tsx}",
      "src/hooks/useStorefrontBack.ts",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/use-memo": "off",
    },
  },
  {
    files: ["e2e/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
  ]),
]);

export default eslintConfig;
