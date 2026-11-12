"use client";

import { useMemo, useState } from "react";
import type { PreviewFile } from "@/lib/types";

export function PreviewPane({ files }: { files: PreviewFile[] }) {
  const [selected, setSelected] = useState("AGENTS.md");
  const current = files.find((file) => file.path === selected) ?? files[0];
  const agents = files.find((file) => file.path === "AGENTS.md");
  const tree = useMemo(() => groupFiles(files), [files]);

  return (
    <div className="panel flex min-h-[32rem] flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Preview</p>
        <div className="flex gap-2">
          <Jump label="AGENTS.md" onClick={() => setSelected("AGENTS.md")} />
          <Jump label="tokens.css" onClick={() => setSelected("app/tokens.css")} />
        </div>
      </div>
      <div className="grid min-h-0 flex-1 md:grid-cols-[11rem_1fr]">
        <div className="file-tree max-h-80 overflow-auto border-b border-line p-3 md:max-h-none md:border-r md:border-b-0">
          {tree.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                {group.label}
              </p>
              {group.files.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  aria-current={file.path === current?.path}
                  className="block w-full truncate rounded px-2 py-1 text-left font-mono text-xs"
                  onClick={() => setSelected(file.path)}
                >
                  {file.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="min-w-0 p-4">
          <p className="mb-2 font-mono text-xs text-muted">
            {current?.path}
            {agents && current?.path === "AGENTS.md"
              ? ` · ${lineCount(agents.contents)} lines`
              : ""}
          </p>
          <pre className="preview font-mono text-xs leading-5">{current?.contents}</pre>
        </div>
      </div>
    </div>
  );
}

function Jump({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="choice rounded-full px-3 py-1 text-xs" onClick={onClick}>
      {label}
    </button>
  );
}

function lineCount(contents: string): number {
  return contents.split(/\r?\n/).length;
}

function groupFiles(
  files: PreviewFile[],
): Array<{ label: string; files: Array<{ path: string; label: string }> }> {
  const groups = new Map<string, Array<{ path: string; label: string }>>();
  for (const file of files) {
    const slash = file.path.lastIndexOf("/");
    const label = slash === -1 ? "root" : file.path.slice(0, slash);
    const name = slash === -1 ? file.path : file.path.slice(slash + 1);
    const list = groups.get(label) ?? [];
    list.push({ path: file.path, label: name });
    groups.set(label, list);
  }
  return [...groups.entries()].map(([label, entries]) => ({ label, files: entries }));
}
