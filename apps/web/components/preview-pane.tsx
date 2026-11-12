"use client";

import type { SeedlayerConfig } from "@seedlayer/core";
import { useEffect, useMemo, useState } from "react";
import { DesignLook } from "@/components/design-look";
import type { PreviewFile } from "@/lib/types";

const JUMPS = [
  "AGENTS.md",
  "DESIGN.md",
  "app/tokens.css",
  "BRANCHING.md",
  "CODE_STYLE.md",
] as const;

export function PreviewPane({
  files,
  design,
  projectName,
  showLook,
}: {
  files: PreviewFile[];
  design: SeedlayerConfig["design"];
  projectName: string;
  showLook: boolean;
}) {
  const [tab, setTab] = useState<"files" | "look">(showLook ? "look" : "files");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("AGENTS.md");

  useEffect(() => {
    setTab(showLook ? "look" : "files");
  }, [showLook]);

  const current =
    files.find((file) => file.path === selected) ??
    files.find((file) => file.path === "AGENTS.md") ??
    files[0];
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle
      ? files.filter((file) => file.path.toLowerCase().includes(needle))
      : files;
    return groupFiles(matched);
  }, [files, query]);
  const agents = files.find((file) => file.path === "AGENTS.md");

  return (
    <div className="preview-pane">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <TabButton label="Files" pressed={tab === "files"} onClick={() => setTab("files")} />
        <TabButton label="Look" pressed={tab === "look"} onClick={() => setTab("look")} />
        <span className="ml-auto font-mono text-[11px] text-muted">
          {tab === "files" && current?.path === "AGENTS.md" && agents
            ? `${lineCount(agents.contents)} / 80 lines`
            : `${files.length} files`}
        </span>
      </div>
      {tab === "look" ? (
        <div className="min-h-0 flex-1 overflow-auto bg-soft">
          <DesignLook design={design} projectName={projectName} />
        </div>
      ) : (
        <div className="preview-split min-h-0 flex-1">
          <div className="file-list bg-soft">
            <input
              className="w-full border-b border-line bg-transparent px-3 py-2 font-mono text-xs"
              value={query}
              placeholder="Filter files"
              aria-label="Filter files"
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="flex gap-1 overflow-x-auto px-2 py-2">
              {JUMPS.filter((path) => files.some((file) => file.path === path)).map((path) => (
                <button
                  key={path}
                  type="button"
                  className="shrink-0 rounded border border-line bg-paper px-2 py-1 font-mono text-[10px]"
                  onClick={() => {
                    setSelected(path);
                    setQuery("");
                  }}
                >
                  {path.split("/").at(-1)}
                </button>
              ))}
            </div>
            {visible.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted">No files match.</p>
            ) : (
              visible.map((group) => (
                <div key={group.label} className="mb-2">
                  <p className="px-3 py-1 font-mono text-[10px] tracking-wide text-muted">
                    {group.label}
                  </p>
                  {group.files.map((file) => (
                    <button
                      key={file.path}
                      type="button"
                      aria-current={file.path === current?.path ? "true" : undefined}
                      className={`block w-full truncate px-3 py-1 text-left font-mono text-xs ${
                        file.path === current?.path ? "bg-accent text-accent-fg" : "hover:bg-paper"
                      }`}
                      onClick={() => setSelected(file.path)}
                    >
                      {file.name}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-code">
            <p className="shrink-0 truncate border-b border-white/10 px-4 py-2 font-mono text-[11px] text-code-muted">
              {current?.path ?? "No file"}
            </p>
            <pre className="code-view">{current?.contents ?? ""}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`rounded-md px-3 py-1 text-sm ${pressed ? "bg-accent text-accent-fg" : "text-muted hover:bg-soft"}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function lineCount(contents: string): number {
  return contents.split(/\r?\n/).length;
}

function groupFiles(
  files: PreviewFile[],
): Array<{ label: string; files: Array<{ path: string; name: string }> }> {
  const groups = new Map<string, Array<{ path: string; name: string }>>();
  for (const file of files) {
    const slash = file.path.lastIndexOf("/");
    const label = slash === -1 ? "root" : file.path.slice(0, slash);
    const list = groups.get(label) ?? [];
    list.push({ path: file.path, name: slash === -1 ? file.path : file.path.slice(slash + 1) });
    groups.set(label, list);
  }
  return [...groups.entries()]
    .sort((left, right) => {
      if (left[0] === "root") return -1;
      if (right[0] === "root") return 1;
      return left[0] < right[0] ? -1 : 1;
    })
    .map(([label, entries]) => ({
      label,
      files: entries.sort((left, right) => (left.path < right.path ? -1 : 1)),
    }));
}
