import { canonicalJson, type RenderContext } from "@seedlayer/core";

export function buildCodeStandards(ctx: RenderContext): Record<string, string> {
  return {
    "biome.json": biomeConfig(ctx),
    "eslint.config.mjs": eslintConfig(ctx),
    "scripts/check-file-size.mjs": fileSizeScript(ctx.config.codeStyle.maxFileLines),
  };
}

function biomeConfig(ctx: RenderContext): string {
  const strictness = ctx.config.codeStyle.strictness;
  const anyRule = strictness === "relaxed" ? "off" : "error";
  return canonicalJson({
    $schema: "https://biomejs.dev/schemas/2.6.7/schema.json",
    css: {
      parser: {
        tailwindDirectives: true,
      },
    },
    files: {
      ignoreUnknown: true,
      includes: ["**", "!!**/.next", "!!**/dist", "!!**/node_modules"],
    },
    formatter: {
      enabled: true,
      indentStyle: "space",
      indentWidth: 2,
      lineWidth: 100,
    },
    javascript: {
      formatter: {
        quoteStyle: "double",
        semicolons: "always",
      },
    },
    linter: {
      enabled: true,
      rules: {
        preset: "recommended",
        suspicious: {
          noExplicitAny: anyRule,
        },
      },
    },
  });
}

function eslintConfig(ctx: RenderContext): string {
  const strictBlock =
    ctx.config.codeStyle.strictness === "relaxed"
      ? ""
      : `
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },`;
  return `import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,${strictBlock}
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
`;
}

function fileSizeScript(maxLines: number): string {
  return `import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const maxLines = ${maxLines};
const skip = new Set(["node_modules", ".next", "dist", "coverage", ".git"]);
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".md"]);

const files = [];
walk(process.cwd(), files);

const tooLong = [];
for (const file of files) {
  if (!extensions.has(path.extname(file))) continue;
  const lines = readFileSync(file, "utf8").split(/\\r?\\n/).length;
  if (lines > maxLines) {
    tooLong.push(\`\${path.relative(process.cwd(), file)} (\${lines})\`);
  }
}

if (tooLong.length > 0) {
  console.error(\`Files exceed \${maxLines} lines:\`);
  for (const line of tooLong) console.error(\`- \${line}\`);
  process.exit(1);
}

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    if (skip.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
}
`;
}
