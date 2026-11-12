"use client";

import type { SeedlayerConfig } from "@seedlayer/core";
import { useEffect, useRef, useState, useTransition } from "react";
import { renderPreview } from "@/app/actions";
import { PreviewPane } from "@/components/preview-pane";
import { SectionEditor } from "@/components/section-editor";
import {
  branchPrefixError,
  PRESET_COPY,
  presetLabel,
  projectNameError,
  SECTIONS,
  type SectionId,
  sectionValue,
} from "@/lib/labels";
import type { PresetOption, PreviewFile } from "@/lib/types";

export function Configurator({
  presets,
  initialConfig,
  initialCode,
  initialName,
  initialFiles,
  initialError,
  initialSection,
}: {
  presets: PresetOption[];
  initialConfig: SeedlayerConfig;
  initialCode: string;
  initialName: string;
  initialFiles: PreviewFile[];
  initialError: string | null;
  initialSection: SectionId;
}) {
  const [section, setSection] = useState<SectionId>(initialSection);
  const [config, setConfig] = useState(initialConfig);
  const [projectName, setProjectName] = useState(initialName);
  const [code, setCode] = useState(initialCode);
  const [files, setFiles] = useState(initialFiles);
  const [error, setError] = useState(initialError);
  const [copied, setCopied] = useState("");
  const [pending, startTransition] = useTransition();
  const skipFirst = useRef(true);

  const nameError = projectNameError(projectName);
  const prefixError = branchPrefixError(config.git.branchPrefix);
  const localError = nameError ?? prefixError;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("s") === section) return;
    url.searchParams.set("s", section);
    window.history.replaceState(null, "", url);
  }, [section]);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (localError) {
      setError(localError);
      return;
    }
    setError(null);
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
    }, 160);
    return () => clearTimeout(handle);
  }, [config, projectName, localError]);

  const command = `npx create-seedlayer ${projectName} --config ${code}`;
  const download = `/api/download?c=${encodeURIComponent(code)}&name=${encodeURIComponent(projectName)}`;
  const status = pending
    ? "Updating preview"
    : error
      ? "Check the highlighted field"
      : `${files.length} files`;

  return (
    <div className="app-shell">
      <header className="flex flex-col gap-3 border-b border-line bg-paper px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-baseline gap-3">
          <p className="font-serif text-[1.7rem] leading-none">Seedlayer</p>
          <p className="hidden text-sm text-muted md:block">{presetLabel(config.preset)}</p>
        </div>
        <label className="flex min-w-0 items-center gap-2 text-sm sm:w-64">
          <span className="shrink-0 text-muted">Project</span>
          <input
            className={`w-full min-w-0 border-b bg-transparent px-1 py-1 font-mono text-sm ${
              nameError ? "border-danger" : "border-line"
            }`}
            value={projectName}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-invalid={nameError ? true : undefined}
            aria-label="Project name"
            onChange={(event) => setProjectName(event.target.value)}
          />
        </label>
        <p className="text-sm text-muted" aria-live="polite">
          {status}
        </p>
      </header>
      {error ? (
        <div
          className="border-b border-danger/30 bg-danger-bg px-4 py-2 text-sm whitespace-pre-wrap text-danger"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      <div className="app-body">
        <aside className="rail grid gap-4 px-3 py-3">
          <fieldset>
            <legend className="mb-2 px-1 text-xs font-medium text-muted">Preset</legend>
            <div className="rail-presets">
              {presets.map((preset) => {
                const copy = PRESET_COPY[preset.id];
                const active = config.preset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={active}
                    className={`rounded-lg border px-3 py-2 text-left ${
                      active ? "border-ink bg-paper" : "border-transparent hover:bg-paper"
                    }`}
                    onClick={() => setConfig(preset.config)}
                  >
                    <span className="block text-sm font-medium">{copy.label}</span>
                    <span className="mt-0.5 block text-xs leading-4 text-muted">{copy.detail}</span>
                  </button>
                );
              })}
            </div>
            {config.preset === "custom" ? (
              <p className="mt-2 px-1 text-xs text-muted">Edited. Pick a preset to reset.</p>
            ) : null}
          </fieldset>
          <nav aria-label="Sections">
            <p className="mb-2 px-1 text-xs font-medium text-muted">Configure</p>
            <div className="rail-sections">
              {SECTIONS.map((item) => {
                const active = item.id === section;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                      active ? "bg-ink text-paper" : "hover:bg-paper"
                    }`}
                    onClick={() => setSection(item.id)}
                  >
                    <span className="font-medium">{item.label}</span>
                    <span
                      className={`truncate font-mono text-[11px] ${active ? "text-paper/70" : "text-muted"}`}
                    >
                      {sectionValue(config, item.id)}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        <main key={section} className="editor px-4 py-6 sm:px-8">
          <SectionEditor section={section} config={config} onChange={setConfig} />
        </main>

        <aside className="output">
          <div className="shrink-0 border-b border-line px-4 py-4">
            <p className="text-sm font-medium">Generate</p>
            <p className="mt-1 text-sm text-muted">
              {sectionValue(config, "stack")} · {sectionValue(config, "standards")} ·{" "}
              {sectionValue(config, "git")}
            </p>
            <pre className="command-text mt-3">{command}</pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md bg-ink px-3 py-2 text-sm text-paper"
                onClick={() => void copyValue(command, setCopied, "command")}
              >
                {copied === "command" ? "Copied" : "Copy command"}
              </button>
              <button
                type="button"
                className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                onClick={() => void copyValue(shareUrl(code, projectName), setCopied, "link")}
              >
                {copied === "link" ? "Copied" : "Copy link"}
              </button>
              <a
                className="rounded-md border border-line bg-paper px-3 py-2 text-sm no-underline"
                href={download}
              >
                Download zip
              </a>
            </div>
          </div>
          <PreviewPane
            files={files}
            design={config.design}
            projectName={projectName}
            showLook={section === "design"}
          />
        </aside>
      </div>
    </div>
  );
}

function shareUrl(code: string, projectName: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set("c", code);
  url.searchParams.set("name", projectName);
  return url.toString();
}

async function copyValue(value: string, setCopied: (value: string) => void, id: string) {
  try {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied(""), 1500);
  } catch {
    setCopied("");
  }
}
