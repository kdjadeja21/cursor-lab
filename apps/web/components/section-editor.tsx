"use client";

import type { SeedlayerConfig } from "@seedlayer/core";
import { designTokens } from "@seedlayer/core/tokens";
import {
  ChoiceList,
  Group,
  LockedRow,
  Segmented,
  SliderField,
  TextField,
} from "@/components/controls";
import {
  AGENTS,
  branchPrefixError,
  COMMANDS,
  COMPONENTS,
  DENSITIES,
  ERRORS,
  FOLDERS,
  FONTS,
  HOSTING,
  LINTERS,
  NAMING,
  PALETTES,
  QUALITY,
  RADII,
  SECTIONS,
  type SectionId,
  STRICTNESS,
  TESTS,
  toggleAgents,
  toggleCommands,
  WORKFLOWS,
} from "@/lib/labels";

const QUALITY_GATES = ["husky", "commitlint", "ci", "pr-review"] as const;

export function SectionEditor({
  section,
  config,
  onChange,
}: {
  section: SectionId;
  config: SeedlayerConfig;
  onChange: (config: SeedlayerConfig) => void;
}) {
  const current = SECTIONS.find((item) => item.id === section);
  const edit = (next: SeedlayerConfig) => onChange({ ...next, preset: "custom" });

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6">
      <header>
        <h2 className="font-serif text-[2rem] leading-none tracking-tight">{current?.label}</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{current?.lede}</p>
      </header>
      <SectionFields section={section} config={config} edit={edit} />
    </div>
  );
}

function SectionFields({
  section,
  config,
  edit,
}: {
  section: SectionId;
  config: SeedlayerConfig;
  edit: (config: SeedlayerConfig) => void;
}) {
  switch (section) {
    case "stack":
      return (
        <div className="grid gap-8">
          <Group title="Included">
            <div>
              <LockedRow label="Framework" value="Next.js" detail="App Router" />
              <LockedRow label="Language" value="TypeScript" detail="strict" />
              <LockedRow label="Styling" value="Tailwind" detail="v4" />
            </div>
          </Group>
          <Group title="Choose">
            <Segmented
              label="Components"
              value={config.stack.components}
              options={COMPONENTS}
              onChange={(components) => edit({ ...config, stack: { ...config.stack, components } })}
            />
            <Segmented
              label="Tests"
              value={config.stack.tests}
              options={TESTS}
              onChange={(tests) => edit({ ...config, stack: { ...config.stack, tests } })}
            />
            <Segmented
              label="Hosting"
              value={config.stack.hosting}
              options={HOSTING}
              onChange={(hosting) => edit({ ...config, stack: { ...config.stack, hosting } })}
            />
          </Group>
          <Group title="Not in this version">
            <div>
              <LockedRow label="Database" value="None" detail="later" />
              <LockedRow label="Auth" value="None" detail="later" />
            </div>
          </Group>
        </div>
      );
    case "design":
      return (
        <div className="grid gap-6">
          <PaletteField value={config.design} onChange={(design) => edit({ ...config, design })} />
          <Segmented
            label="Radius"
            value={config.design.radius}
            options={RADII}
            onChange={(radius) => edit({ ...config, design: { ...config.design, radius } })}
          />
          <Segmented
            label="Font"
            hint="The Look tab uses this font."
            value={config.design.fontSans}
            options={FONTS}
            onChange={(fontSans) => edit({ ...config, design: { ...config.design, fontSans } })}
          />
          <Segmented
            label="Density"
            value={config.design.density}
            options={DENSITIES}
            onChange={(density) => edit({ ...config, design: { ...config.design, density } })}
          />
        </div>
      );
    case "standards":
      return (
        <div className="grid gap-8">
          <Group title="Lint">
            <Segmented
              label="Linter"
              value={config.codeStyle.linter}
              options={LINTERS}
              onChange={(linter) => edit({ ...config, codeStyle: { ...config.codeStyle, linter } })}
            />
            <ChoiceList
              label="Strictness"
              mode="one"
              options={STRICTNESS}
              isSelected={(value) => value === config.codeStyle.strictness}
              onSelect={(strictness) =>
                edit({ ...config, codeStyle: { ...config.codeStyle, strictness } })
              }
            />
          </Group>
          <Group title="Shape">
            <SliderField
              label="Max file lines"
              hint="The generated check fails a file over this length."
              min={80}
              max={1000}
              step={10}
              value={config.codeStyle.maxFileLines}
              onChange={(maxFileLines) =>
                edit({ ...config, codeStyle: { ...config.codeStyle, maxFileLines } })
              }
            />
            <Segmented
              label="Folders"
              value={config.codeStyle.folders}
              options={FOLDERS}
              onChange={(folders) =>
                edit({ ...config, codeStyle: { ...config.codeStyle, folders } })
              }
            />
            <Segmented
              label="Naming"
              value={config.codeStyle.naming}
              options={NAMING}
              onChange={(naming) => edit({ ...config, codeStyle: { ...config.codeStyle, naming } })}
            />
            <Segmented
              label="Errors"
              value={config.codeStyle.errorHandling}
              options={ERRORS}
              onChange={(errorHandling) =>
                edit({ ...config, codeStyle: { ...config.codeStyle, errorHandling } })
              }
            />
          </Group>
        </div>
      );
    case "git":
      return (
        <div className="grid gap-6">
          <ChoiceList
            label="Workflow"
            mode="one"
            options={WORKFLOWS}
            isSelected={(value) => value === config.git.workflow}
            onSelect={(workflow) => edit({ ...config, git: { ...config.git, workflow } })}
          />
          <TextField
            label="Branch prefix"
            value={config.git.branchPrefix}
            hint="New branches start with this. Example: agent/login."
            error={branchPrefixError(config.git.branchPrefix)}
            mono
            onChange={(branchPrefix) => edit({ ...config, git: { ...config.git, branchPrefix } })}
          />
          <SliderField
            label="Max pull request lines"
            hint="BRANCHING.md tells the agent to split a diff larger than this."
            min={50}
            max={2000}
            step={10}
            value={config.git.maxPrLines}
            onChange={(maxPrLines) => edit({ ...config, git: { ...config.git, maxPrLines } })}
          />
          <p className="text-sm text-muted">Commits use Conventional Commits.</p>
        </div>
      );
    case "agents":
      return (
        <ChoiceList
          label="Write rules for"
          mode="many"
          options={AGENTS}
          isSelected={(value) => config.agents.includes(value)}
          onSelect={(value) => {
            const agents = toggleAgents(config.agents, value);
            if (!agents) return;
            edit({ ...config, agents });
          }}
        />
      );
    case "workflow":
      return (
        <div className="grid gap-8">
          <ChoiceList
            label="Commands"
            mode="many"
            options={COMMANDS}
            isSelected={(value) => config.workflow.includes(value)}
            onSelect={(value) => {
              const workflow = toggleCommands(config.workflow, value);
              if (!workflow) return;
              edit({ ...config, workflow });
            }}
          />
          <ChoiceList
            label="Quality gates"
            mode="many"
            hint="commitlint turns Husky on. Turning Husky off turns commitlint off."
            options={QUALITY}
            isSelected={(value) => config.quality.includes(value)}
            onSelect={(value) => edit({ ...config, quality: toggleQuality(config.quality, value) })}
          />
        </div>
      );
    default: {
      const exhaustive: never = section;
      throw new Error(`Unknown section ${String(exhaustive)}`);
    }
  }
}

function PaletteField({
  value,
  onChange,
}: {
  value: SeedlayerConfig["design"];
  onChange: (design: SeedlayerConfig["design"]) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">Palette</legend>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PALETTES.map((palette) => {
          const tokens = designTokens({ ...value, palette: palette.value });
          const on = value.palette === palette.value;
          return (
            <button
              key={palette.value}
              type="button"
              aria-pressed={on}
              className={`flex min-h-32 flex-col justify-between rounded-lg border p-3 text-left ${
                on ? "ring-2 ring-accent ring-offset-2 ring-offset-bg" : ""
              }`}
              style={{ background: tokens.bg, color: tokens.fg, borderColor: tokens.border }}
              onClick={() => onChange({ ...value, palette: palette.value })}
            >
              <span className="flex gap-1.5" aria-hidden="true">
                <span
                  className="h-7 flex-1"
                  style={{ background: tokens.accent, borderRadius: tokens.radius }}
                />
                <span
                  className="h-7 flex-1"
                  style={{ background: tokens.highlight, borderRadius: tokens.radius }}
                />
                <span
                  className="h-7 w-7"
                  style={{ background: tokens.danger, borderRadius: tokens.radius }}
                />
              </span>
              <span>
                <span className="block text-sm font-medium">{palette.label}</span>
                <span className="mt-0.5 block text-xs" style={{ color: tokens.mutedFg }}>
                  {palette.detail}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function toggleQuality(
  selected: SeedlayerConfig["quality"],
  value: SeedlayerConfig["quality"][number],
): SeedlayerConfig["quality"] {
  const next = new Set(selected);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  if (value === "commitlint" && next.has("commitlint")) next.add("husky");
  if (value === "husky" && !next.has("husky")) next.delete("commitlint");
  return QUALITY_GATES.filter((gate) => next.has(gate));
}
