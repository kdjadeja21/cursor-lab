"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildTableExport,
  downloadFilename,
  toCsv,
  toXlsx,
  type TabularExport,
} from "@/lib/table-export";
import type { FieldMapping } from "@/lib/types";

function saveFile(contents: BlobPart, filename: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function download(table: TabularExport, format: "csv" | "xlsx") {
  if (format === "csv") {
    saveFile(toCsv(table), downloadFilename("csv"), "text/csv;charset=utf-8");
    return;
  }
  const bytes = toXlsx(table);
  saveFile(
    bytes,
    downloadFilename("xlsx"),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}

/**
 * Downloads every row in the current search and sort, not only the page on
 * screen. Numbers stay numeric in both CSV and Excel.
 */
export function TableDownload({
  columns,
  rows,
}: {
  columns: FieldMapping[];
  rows: Record<string, unknown>[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const disabled = columns.length === 0;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const exportTable = () => buildTableExport(columns, rows);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title="Download every row in this view, including other pages"
        onClick={() => setOpen((current) => !current)}
      >
        <Download className="size-3.5" aria-hidden />
        Download
        <ChevronDown className="size-3.5" aria-hidden />
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Download table"
          className="absolute top-[calc(100%+4px)] right-0 z-20 w-44 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lift"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-ink hover:bg-surface-muted"
            onClick={() => {
              download(exportTable(), "csv");
              setOpen(false);
            }}
          >
            <FileText className="size-3.5 text-ink-subtle" aria-hidden />
            CSV
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-ink hover:bg-surface-muted"
            onClick={() => {
              download(exportTable(), "xlsx");
              setOpen(false);
            }}
          >
            <FileSpreadsheet className="size-3.5 text-ink-subtle" aria-hidden />
            Excel
          </button>
        </div>
      ) : null}
    </div>
  );
}
