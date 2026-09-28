"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { isNumericFormat } from "@/lib/format";
import { getByPath } from "@/lib/infer-schema";
import { resolveTable } from "@/lib/widget-data";
import type { FieldPath, TableConfig } from "@/lib/types";
import { FieldValue } from "./field-value";
import { WidgetIssues } from "./widget-issues";

function samePath(a: FieldPath, b: FieldPath) {
  return a.length === b.length && a.every((segment, index) => segment === b[index]);
}

export function TableWidget({
  config,
  data,
}: {
  config: TableConfig;
  data: unknown;
}) {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(config.sort);

  const resolved = useMemo(
    () => resolveTable({ ...config, search: query || config.search, sort }, data),
    [config, data, query, sort],
  );

  if (resolved.error || !resolved.value) {
    return <WidgetIssues error={resolved.error} missing={resolved.missing} />;
  }

  const { columns, rows, totalRows } = resolved.value;
  const pageSize = Math.max(1, config.pageSize);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = rows.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  );

  const toggleSort = (path: FieldPath) => {
    setSort((current) => {
      if (!current || !samePath(current.path, path)) {
        return { path, direction: "asc" };
      }
      return current.direction === "asc" ? { path, direction: "desc" } : null;
    });
    setPage(0);
  };

  return (
    <div className="flex h-full flex-col gap-2.5">
      <WidgetIssues missing={resolved.missing} />

      <label className="relative block">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-subtle"
          aria-hidden
        />
        <span className="sr-only">Search table rows</span>
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          placeholder="Search rows"
          className="w-full rounded-lg border border-line-strong bg-surface py-1.5 pr-2.5 pl-8 text-xs shadow-xs transition-[border-color,box-shadow] placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/18 focus:outline-none"
        />
      </label>

      <div className="scroll-slim min-h-0 flex-1 overflow-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-surface-muted/95 backdrop-blur">
            <tr>
              {columns.map((column) => {
                const active = sort && samePath(sort.path, column.path);
                const numeric = isNumericFormat(column.format);
                return (
                  <th
                    key={column.path.join(".")}
                    scope="col"
                    className="border-b border-line p-0 first:rounded-tl-xl last:rounded-tr-xl"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column.path)}
                      aria-label={`Sort by ${column.label}`}
                      className={cn(
                        "flex w-full items-center gap-1 px-3 py-2 text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase transition-colors hover:text-ink",
                        numeric && "justify-end",
                        active ? "text-brand-strong" : "text-ink-subtle",
                      )}
                    >
                      {column.label}
                      {active ? (
                        sort.direction === "asc" ? (
                          <ArrowUp className="size-3" aria-hidden />
                        ) : (
                          <ArrowDown className="size-3" aria-hidden />
                        )
                      ) : null}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-line/70 transition-colors last:border-0 hover:bg-brand-soft/60"
              >
                {columns.map((column) => (
                  <td
                    key={column.path.join(".")}
                    className={cn(
                      "max-w-[20rem] truncate px-3 py-2",
                      isNumericFormat(column.format) &&
                        "text-right tabular-nums",
                    )}
                  >
                    <FieldValue
                      value={getByPath(row, column.path)}
                      format={column.format}
                      label={column.label}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(1, columns.length)}
                  className="px-3 py-8 text-center text-ink-muted"
                >
                  No rows match this view.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-ink-subtle">
        <span>
          {rows.length === totalRows
            ? `${rows.length} row${rows.length === 1 ? "" : "s"}`
            : `${rows.length} of ${totalRows} rows`}
        </span>
        {pageCount > 1 ? (
          <span className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Previous page"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft className="size-3.5" aria-hidden />
            </Button>
            <span className="tabular-nums">
              {currentPage + 1} / {pageCount}
            </span>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Next page"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight className="size-3.5" aria-hidden />
            </Button>
          </span>
        ) : null}
      </div>
    </div>
  );
}
