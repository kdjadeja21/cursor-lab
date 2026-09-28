"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatValue } from "@/lib/format";
import { getByPath } from "@/lib/infer-schema";
import { resolveTable } from "@/lib/widget-data";
import type { FieldPath, TableConfig } from "@/lib/types";
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
      return current.direction === "asc"
        ? { path, direction: "desc" }
        : null;
    });
    setPage(0);
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <WidgetIssues missing={resolved.missing} />

      <label className="relative">
        <Search
          className="pointer-events-none absolute top-2 left-2 size-3.5 text-ink-subtle"
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
          className="w-full rounded-lg border border-line-strong bg-surface py-1.5 pr-2 pl-7 text-xs"
        />
      </label>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-surface-muted">
            <tr>
              {columns.map((column) => {
                const active = sort && samePath(sort.path, column.path);
                return (
                  <th key={column.path.join(".")} scope="col" className="p-0">
                    <button
                      type="button"
                      onClick={() => toggleSort(column.path)}
                      aria-label={`Sort by ${column.label}`}
                      className={cn(
                        "flex w-full items-center gap-1 px-2.5 py-2 font-medium whitespace-nowrap",
                        active ? "text-brand-strong" : "text-ink-muted",
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
                className="border-t border-line even:bg-surface-muted/40"
              >
                {columns.map((column) => (
                  <td
                    key={column.path.join(".")}
                    className="max-w-[18rem] truncate px-2.5 py-1.5"
                  >
                    {formatValue(getByPath(row, column.path), column.format)}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(1, columns.length)}
                  className="px-2.5 py-6 text-center text-ink-muted"
                >
                  No rows match this view.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[11px] text-ink-muted">
        <span>
          {rows.length === totalRows
            ? `${rows.length} row${rows.length === 1 ? "" : "s"}`
            : `${rows.length} of ${totalRows} rows`}
        </span>
        {pageCount > 1 ? (
          <span className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span>
              Page {currentPage + 1} of {pageCount}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>
          </span>
        ) : null}
      </div>
    </div>
  );
}
