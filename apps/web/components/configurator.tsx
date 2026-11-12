"use client";

import type { SeedlayerConfig } from "@seedlayer/core";
import { useEffect, useState, useTransition } from "react";
import { renderPreview } from "@/app/actions";
import { PreviewPane } from "@/components/preview-pane";
import type { PresetOption, PreviewFile } from "@/lib/types";

const STEPS = ["Stack", "Design", "Standards", "Git", "Agents", "Workflow"] as const;
type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;

function asStep(value: number): StepIndex {
  switch (value) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 3:
      return 3;
    case 4:
      return 4;
    case 5:
      return 5;
    default:
      return 0;
  }
}
const SWATCH: Record<SeedlayerConfig["design"]["palette"], string> = {
  neutral: "#171717",
  slate: "#0f172a",
  zinc: "#18181b",
  vivid: "#146c43",
};

export function Configurator({
  presets,
  initialConfig,
  initialCode,
  initialName,
  initialFiles,
  initialError,
}: {
  presets: PresetOption[];
  initialConfig: SeedlayerConfig;
  initialCode: string;
  initialName: string;
  initialFiles: PreviewFile[];
  initialError: string | null;
}) {
  const [step, setStep] = useState<StepIndex>(0);
  const [config, setConfig] = useState(initialConfig);
  const [projectName, setProjectName] = useState(initialName);
  const [code, setCode] = useState(initialCode);
  const [files, setFiles] = useState(initialFiles);
  const [error, setError] = useState(initialError);
  const [copied, setCopied] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(async () => {
        const result = await renderPreview(config, projectName);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setError(null);
        setCode(result.code);
        setFiles(result.files);
        const url = new URL(window.location.href);
        url.searchParams.set("c", result.code);
        url.searchParams.set("name", projectName);
        window.history.replaceState(null, "", url);
      });
    }, 180);
    return () => clearTimeout(handle);
  }, [config, projectName]);

  const command = `npx create-seedlayer ${projectName} --config ${code}`;
  const download = `/api/download?c=${encodeURIComponent(code)}&name=${encodeURIComponent(projectName)}`;

  return (
    <div className="shell mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6">
      <header className="topbar flex flex-col gap-4 rounded-2xl px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">Seedlayer</p>
          <h1 className="font-serif text-4xl leading-none">
            Configure once. Generate the context.
          </h1>
        </div>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Presets</legend>
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={config.preset === preset.id}
              className="choice rounded-full px-3 py-1 text-sm"
              onClick={() => setConfig(preset.config)}
            >
              {preset.id}
            </button>
          ))}
        </fieldset>
      </header>

      <div className="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)_minmax(0,1.1fr)]">
        <nav className="panel h-fit rounded-2xl p-2" aria-label="Sections">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${index === step ? "step-current" : ""}`}
              aria-current={index === step ? "step" : undefined}
              onClick={() => setStep(asStep(index))}
            >
              {index + 1}. {label}
            </button>
          ))}
        </nav>

        <form className="panel rounded-2xl p-5" onSubmit={(event) => event.preventDefault()}>
          <StepForm step={step} config={config} onChange={setConfig} />
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              className="choice rounded-full px-4 py-2 text-sm"
              onClick={() => setStep((value) => asStep(value - 1))}
              disabled={step === 0}
            >
              Back
            </button>
            <button
              type="button"
              className="rounded-full bg-signal px-4 py-2 text-sm text-signal-ink"
              onClick={() => setStep((value) => asStep(value + 1))}
              disabled={step === STEPS.length - 1}
            >
              Next
            </button>
          </div>
        </form>

        <PreviewPane files={files} />
      </div>

      <section className="command rounded-2xl p-4">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end">
          <label className="block text-sm">
            Project name
            <input
              className="mt-1 block w-full rounded-lg border border-line bg-transparent px-3 py-2 font-mono"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
            />
          </label>
          <p className="text-sm text-muted" aria-live="polite">
            {pending ? "Rendering…" : error ? error : `${files.length} files`}
          </p>
        </div>
        <pre className="preview mb-3 overflow-auto font-mono text-sm">{command}</pre>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-ink px-4 py-2 text-sm text-paper"
            onClick={() => copy(command, setCopied, "command")}
          >
            {copied === "command" ? "Copied" : "Copy command"}
          </button>
          <button
            type="button"
            className="choice rounded-full px-4 py-2 text-sm"
            onClick={() => copy(window.location.href, setCopied, "link")}
          >
            {copied === "link" ? "Copied" : "Copy link"}
          </button>
          <a className="choice rounded-full px-4 py-2 text-sm" href={download}>
            Download zip
          </a>
        </div>
      </section>
    </div>
  );
}

function StepForm({
  step,
  config,
  onChange,
}: {
  step: StepIndex;
  config: SeedlayerConfig;
  onChange: (config: SeedlayerConfig) => void;
}) {
  const set = (next: SeedlayerConfig) => onChange({ ...next, preset: "custom" });
  switch (step) {
    case 0:
      return (
        <div className="grid gap-4">
          <Choices
            label="Framework"
            value={config.stack.framework}
            options={["nextjs"]}
            onChange={() => undefined}
          />
          <Choices
            label="Language"
            value={config.stack.language}
            options={["typescript"]}
            onChange={() => undefined}
          />
          <Choices
            label="Styling"
            value={config.stack.styling}
            options={["tailwind"]}
            onChange={() => undefined}
          />
          <Choices
            label="Components"
            value={config.stack.components}
            options={["shadcn", "none"]}
            onChange={(components) => set({ ...config, stack: { ...config.stack, components } })}
          />
          <Choices
            label="Tests"
            value={config.stack.tests}
            options={["vitest", "none"]}
            onChange={(tests) => set({ ...config, stack: { ...config.stack, tests } })}
          />
          <Choices
            label="Hosting"
            value={config.stack.hosting}
            options={["vercel", "none"]}
            onChange={(hosting) => set({ ...config, stack: { ...config.stack, hosting } })}
          />
          <p className="text-sm text-muted">Database and auth stay unset in this alpha.</p>
        </div>
      );
    case 1:
      return (
        <div className="grid gap-4">
          <Choices
            label="Palette"
            value={config.design.palette}
            options={["neutral", "slate", "zinc", "vivid"]}
            swatch={SWATCH}
            onChange={(palette) => set({ ...config, design: { ...config.design, palette } })}
          />
          <Choices
            label="Radius"
            value={config.design.radius}
            options={["none", "sm", "md", "lg"]}
            onChange={(radius) => set({ ...config, design: { ...config.design, radius } })}
          />
          <Choices
            label="Font"
            value={config.design.fontSans}
            options={["Inter", "Geist", "system"]}
            onChange={(fontSans) => set({ ...config, design: { ...config.design, fontSans } })}
          />
          <Choices
            label="Density"
            value={config.design.density}
            options={["compact", "comfortable", "spacious"]}
            onChange={(density) => set({ ...config, design: { ...config.design, density } })}
          />
        </div>
      );
    case 2:
      return (
        <div className="grid gap-4">
          <Choices
            label="Linter"
            value={config.codeStyle.linter}
            options={["biome", "eslint"]}
            onChange={(linter) => set({ ...config, codeStyle: { ...config.codeStyle, linter } })}
          />
          <Choices
            label="Strictness"
            value={config.codeStyle.strictness}
            options={["relaxed", "standard", "strict"]}
            onChange={(strictness) =>
              set({ ...config, codeStyle: { ...config.codeStyle, strictness } })
            }
          />
          <NumberField
            label="Max file lines"
            value={config.codeStyle.maxFileLines}
            min={80}
            max={1000}
            onChange={(maxFileLines) =>
              set({ ...config, codeStyle: { ...config.codeStyle, maxFileLines } })
            }
          />
          <Choices
            label="Folders"
            value={config.codeStyle.folders}
            options={["feature", "type"]}
            onChange={(folders) => set({ ...config, codeStyle: { ...config.codeStyle, folders } })}
          />
          <Choices
            label="Naming"
            value={config.codeStyle.naming}
            options={["kebab-files", "pascal-components"]}
            onChange={(naming) => set({ ...config, codeStyle: { ...config.codeStyle, naming } })}
          />
          <Choices
            label="Errors"
            value={config.codeStyle.errorHandling}
            options={["throw", "result"]}
            onChange={(errorHandling) =>
              set({ ...config, codeStyle: { ...config.codeStyle, errorHandling } })
            }
          />
        </div>
      );
    case 3:
      return (
        <div className="grid gap-4">
          <Choices
            label="Workflow"
            value={config.git.workflow}
            options={["trunk", "github-flow", "agent-safe"]}
            onChange={(workflow) => set({ ...config, git: { ...config.git, workflow } })}
          />
          <label className="block text-sm">
            Branch prefix
            <input
              className="mt-1 block w-full rounded-lg border border-line bg-transparent px-3 py-2 font-mono"
              value={config.git.branchPrefix}
              onChange={(event) =>
                set({ ...config, git: { ...config.git, branchPrefix: event.target.value } })
              }
            />
          </label>
          <NumberField
            label="Max pull request lines"
            value={config.git.maxPrLines}
            min={50}
            max={2000}
            onChange={(maxPrLines) => set({ ...config, git: { ...config.git, maxPrLines } })}
          />
          <p className="text-sm text-muted">Commits use Conventional Commits.</p>
        </div>
      );
    case 4:
      return (
        <Checks
          label="Agents"
          options={["cursor", "claude-code"]}
          selected={config.agents}
          onChange={(agents) => {
            if (agents.length === 0) return;
            set({ ...config, agents });
          }}
        />
      );
    case 5:
      return (
        <div className="grid gap-4">
          <Checks
            label="Commands"
            options={["plan", "implement", "review"]}
            selected={config.workflow}
            onChange={(workflow) => {
              if (workflow.length === 0) return;
              set({ ...config, workflow });
            }}
          />
          <Checks
            label="Quality"
            options={["husky", "commitlint", "ci", "pr-review"]}
            selected={config.quality}
            onChange={(quality) => set({ ...config, quality: normalizeQuality(quality) })}
          />
        </div>
      );
    default: {
      const exhaustive: never = step;
      throw new Error(`Unknown step ${String(exhaustive)}`);
    }
  }
}

const QUALITY_GATES = ["husky", "commitlint", "ci", "pr-review"] as const;

function normalizeQuality(quality: SeedlayerConfig["quality"]): SeedlayerConfig["quality"] {
  const next = new Set(quality);
  if (next.has("commitlint")) next.add("husky");
  if (!next.has("husky")) next.delete("commitlint");
  return QUALITY_GATES.filter((gate) => next.has(gate));
}

function Choices<T extends string>({
  label,
  value,
  options,
  onChange,
  swatch,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  swatch?: Record<string, string>;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === value}
            className="choice inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm"
            onClick={() => onChange(option)}
          >
            {swatch?.[option] ? (
              <span className="swatch" style={{ background: swatch[option] }} />
            ) : null}
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Checks<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly T[];
  selected: readonly T[];
  onChange: (value: T[]) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const on = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              className="choice rounded-full px-3 py-1 text-sm"
              onClick={() =>
                onChange(on ? selected.filter((item) => item !== option) : [...selected, option])
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        className="mt-1 block w-32 rounded-lg border border-line bg-transparent px-3 py-2 font-mono"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

async function copy(value: string, setCopied: (value: string) => void, id: string) {
  await navigator.clipboard.writeText(value);
  setCopied(id);
  window.setTimeout(() => setCopied(""), 1500);
}
