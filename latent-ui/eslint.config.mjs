import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored registry code (shadcn, ReUI, Dice UI), installed by `shadcn add` and
    // refreshed the same way. It is not hand-edited here, so it is not linted here:
    // patching it would be lost on the next `shadcn add --overwrite`. Our own code
    // (app/, registry/, components/gallery/, lib/gallery/) is linted in full.
    // A newly vendored file outside these paths fails lint until it is listed.
    "components/ui/**",
    "components/reui/**",
    "components/data-grid/**",
    "components/data-table/**",
    "components/visually-hidden-input.tsx",
    "hooks/use-*.ts",
    "lib/compose-refs.ts",
    "lib/data-grid-*.ts",
    "lib/data-table-*.ts",
    "lib/format.ts",
    "lib/parsers.ts",
    "lib/table-features.ts",
  ]),
]);

export default eslintConfig;
