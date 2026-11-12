import { canonicalJson, type RenderContext, type SeedlayerConfig } from "@seedlayer/core";

const VERSIONS = {
  next: "16.3.4",
  react: "19.2.8",
  reactDom: "19.2.8",
  tailwindcss: "4.3.5",
  tailwindPostcss: "4.3.5",
  typescript: "5.9.3",
  typesNode: "22.19.21",
  typesReact: "19.3.0",
  typesReactDom: "19.3.0",
  vitest: "5.1.0",
  biome: "2.6.7",
  eslint: "9.39.4",
  eslintConfigNext: "16.3.4",
  clsx: "2.1.1",
  tailwindMerge: "3.7.0",
  cva: "0.7.1",
  husky: "9.1.7",
  commitlintCli: "21.2.4",
  commitlintConfig: "21.2.4",
};

export function buildStack(ctx: RenderContext): Record<string, string> {
  const buttonPath =
    ctx.config.codeStyle.naming === "pascal-components"
      ? "components/ui/Button.tsx"
      : "components/ui/button.tsx";
  return {
    "package.json": packageJson(ctx),
    "tsconfig.json": tsconfig(),
    "next.config.ts": nextConfig(),
    "next-env.d.ts": nextEnv(),
    "postcss.config.mjs": postcss(),
    "app/globals.css": globalsCss(),
    "app/layout.tsx": layout(ctx),
    "app/page.tsx": page(ctx),
    "lib/format-title.ts": formatTitle(ctx),
    "lib/format-title.test.ts": formatTitleTest(ctx),
    "lib/result.ts": resultType(),
    "lib/utils.ts": utils(),
    "vitest.config.ts": vitestConfig(),
    "components.json": componentsJson(ctx),
    [buttonPath]: button(),
    ".gitignore": gitignore(),
  };
}

function packageJson(ctx: RenderContext): string {
  const dependencies: Record<string, string> = {
    next: VERSIONS.next,
    react: VERSIONS.react,
    "react-dom": VERSIONS.reactDom,
  };
  if (ctx.flags.shadcn) {
    dependencies["class-variance-authority"] = VERSIONS.cva;
    dependencies.clsx = VERSIONS.clsx;
    dependencies["tailwind-merge"] = VERSIONS.tailwindMerge;
  }

  const devDependencies: Record<string, string> = {
    "@tailwindcss/postcss": VERSIONS.tailwindPostcss,
    "@types/node": VERSIONS.typesNode,
    "@types/react": VERSIONS.typesReact,
    "@types/react-dom": VERSIONS.typesReactDom,
    tailwindcss: VERSIONS.tailwindcss,
    typescript: VERSIONS.typescript,
  };
  if (ctx.flags.biome) devDependencies["@biomejs/biome"] = VERSIONS.biome;
  if (ctx.flags.eslint) {
    devDependencies.eslint = VERSIONS.eslint;
    devDependencies["eslint-config-next"] = VERSIONS.eslintConfigNext;
  }
  if (ctx.flags.vitest) devDependencies.vitest = VERSIONS.vitest;
  if (ctx.flags.husky) devDependencies.husky = VERSIONS.husky;
  if (ctx.flags.commitlint) {
    devDependencies["@commitlint/cli"] = VERSIONS.commitlintCli;
    devDependencies["@commitlint/config-conventional"] = VERSIONS.commitlintConfig;
  }

  const lint = ctx.flags.biome ? "biome check ." : "eslint .";
  const scripts: Record<string, string> = {
    dev: "next dev",
    build: "next build",
    start: "next start",
    lint: `${lint} && node scripts/check-file-size.mjs`,
    typecheck: "tsc --noEmit",
    test: ctx.flags.vitest ? "vitest run" : 'node -e "process.exit(0)"',
  };
  if (ctx.flags.husky) scripts.prepare = "husky";

  return json({
    name: ctx.projectName,
    version: "0.1.0",
    private: true,
    scripts,
    dependencies: sortRecord(dependencies),
    devDependencies: sortRecord(devDependencies),
  });
}

function tsconfig(): string {
  return json({
    compilerOptions: {
      target: "ES2017",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "react-jsx",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: { "@/*": ["./*"] },
    },
    include: [
      "next-env.d.ts",
      "**/*.ts",
      "**/*.tsx",
      ".next/types/**/*.ts",
      ".next/dev/types/**/*.ts",
      "**/*.mts",
    ],
    exclude: ["node_modules"],
  });
}

function nextConfig(): string {
  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
`;
}

function nextEnv(): string {
  return `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`;
}

function postcss(): string {
  return `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`;
}

function globalsCss(): string {
  return `@import "tailwindcss";
@import "./tokens.css";

@theme inline {
  --color-background: var(--color-bg);
  --color-foreground: var(--color-fg);
  --color-muted: var(--color-muted);
  --color-muted-foreground: var(--color-muted-fg);
  --color-border: var(--color-border);
  --color-accent: var(--color-accent);
  --color-accent-foreground: var(--color-accent-fg);
  --color-highlight: var(--color-highlight);
  --color-highlight-foreground: var(--color-highlight-fg);
  --color-danger: var(--color-danger);
  --font-sans: var(--font-sans);
  --radius-control: var(--radius);
}

body {
  background: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-sans);
}

.page-shell {
  margin-inline: auto;
  max-width: 72rem;
  padding: var(--space-section);
}

.eyebrow {
  color: var(--color-muted-fg);
  font-size: 0.875rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h1 {
  margin: 0.5rem 0 1rem;
  font-size: 2.5rem;
  line-height: 1.1;
}

.lede {
  max-width: 40rem;
  color: var(--color-muted-fg);
}

.token-button {
  margin-top: 1.5rem;
  border: 0;
  border-radius: var(--radius);
  background: var(--color-accent);
  color: var(--color-accent-fg);
  padding: 0.625rem 1rem;
  font: inherit;
}
`;
}

function layout(ctx: RenderContext): string {
  const font = ctx.config.design.fontSans;
  if (font === "system") {
    return `import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "${ctx.projectName}",
  description: "Generated by Seedlayer.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
`;
  }

  const importName = font === "Geist" ? "Geist" : "Inter";
  return `import type { Metadata } from "next";
import { ${importName} } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const sans = ${importName}({
  subsets: ["latin"],
  variable: "--font-loaded-sans",
});

export const metadata: Metadata = {
  title: "${ctx.projectName}",
  description: "Generated by Seedlayer.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={\`\${sans.variable} h-full antialiased\`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
`;
}

function page(ctx: RenderContext): string {
  if (!ctx.flags.shadcn) {
    return `export default function HomePage() {
  return (
    <main className="page-shell">
      <p className="eyebrow">${ctx.projectName}</p>
      <h1>Tokens first.</h1>
      <p className="lede">
        Colors, type, and spacing come from app/tokens.css. Do not hardcode a color when a token
        exists.
      </p>
      <button className="token-button" type="button">
        Continue
      </button>
    </main>
  );
}
`;
  }
  return `import { Button } from "${ctx.buttonImport}";

export default function HomePage() {
  return (
    <main className="page-shell">
      <p className="eyebrow">${ctx.projectName}</p>
      <h1>Tokens first.</h1>
      <p className="lede">
        Colors, type, and spacing come from app/tokens.css. Do not hardcode a color when a token
        exists.
      </p>
      <Button type="button">Continue</Button>
    </main>
  );
}
`;
}

function formatTitle(ctx: RenderContext): string {
  if (!ctx.flags.result) {
    return `export function formatTitle(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Title is empty");
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
`;
  }
  return `import { err, ok, type Result } from "./result";

export function formatTitle(input: string): Result<string, string> {
  const trimmed = input.trim();
  if (!trimmed) return err("Title is empty");
  return ok(trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
}
`;
}

function formatTitleTest(ctx: RenderContext): string {
  if (!ctx.flags.result) {
    return `import { describe, expect, it } from "vitest";
import { formatTitle } from "./format-title";

describe("formatTitle", () => {
  it("trims and capitalizes", () => {
    expect(formatTitle("  seedlayer  ")).toBe("Seedlayer");
  });

  it("rejects an empty title", () => {
    expect(() => formatTitle("   ")).toThrow(/empty/i);
  });
});
`;
  }
  return `import { describe, expect, it } from "vitest";
import { formatTitle } from "./format-title";

describe("formatTitle", () => {
  it("trims and capitalizes", () => {
    expect(formatTitle("  seedlayer  ")).toEqual({ ok: true, value: "Seedlayer" });
  });

  it("rejects an empty title", () => {
    expect(formatTitle("   ")).toEqual({ ok: false, error: "Title is empty" });
  });
});
`;
}

function resultType(): string {
  return `export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
`;
}

function utils(): string {
  return `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
`;
}

function button(): string {
  return `import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground hover:opacity-90",
        ghost: "border border-border bg-transparent text-foreground",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  return <button className={classes} {...props} />;
}
`;
}

function vitestConfig(): string {
  return `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
`;
}

function shadcnBase(
  palette: SeedlayerConfig["design"]["palette"],
): "stone" | "slate" | "zinc" | "neutral" {
  switch (palette) {
    case "ink":
    case "ember":
      return "stone";
    case "harbor":
      return "slate";
    case "iris":
    case "dusk":
      return "zinc";
    case "grove":
      return "neutral";
    default: {
      const exhaustive: never = palette;
      return exhaustive;
    }
  }
}

function componentsJson(ctx: RenderContext): string {
  const baseColor = shadcnBase(ctx.config.design.palette);
  return json({
    $schema: "https://ui.shadcn.com/schema.json",
    style: "new-york",
    rsc: true,
    tsx: true,
    tailwind: {
      config: "",
      css: "app/globals.css",
      baseColor,
      cssVariables: true,
      prefix: "",
    },
    aliases: {
      components: "@/components",
      utils: "@/lib/utils",
      ui: "@/components/ui",
      lib: "@/lib",
      hooks: "@/hooks",
    },
    iconLibrary: "lucide",
  });
}

function gitignore(): string {
  return `node_modules
.next
out
dist
.vercel
*.log
.env
.env.local
.env.*.local
!.env.example
`;
}

function json(value: unknown): string {
  return canonicalJson(value);
}

function sortRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => (left < right ? -1 : 1)),
  );
}
