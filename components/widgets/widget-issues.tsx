import { AlertTriangle } from "lucide-react";
import { pathLabel } from "@/lib/infer-schema";
import type { FieldMapping } from "@/lib/types";

/**
 * Surfaces configuration drift instead of silently remapping fields: if the API
 * stops returning a mapped path, the widget says so and keeps its mapping.
 */
export function WidgetIssues({
  error,
  missing = [],
}: {
  error?: string | null;
  missing?: FieldMapping[];
}) {
  if (!error && missing.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-warning/30 bg-warning/10 p-2.5 text-[11px] text-ink">
      {error ? (
        <p className="flex items-start gap-1.5">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
          <span>{error}</span>
        </p>
      ) : null}
      {missing.length > 0 ? (
        <p className="flex items-start gap-1.5">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
          <span>
            Missing from the latest response:{" "}
            {missing.map((mapping) => pathLabel(mapping.path)).join(", ")}. The
            mapping was kept so it recovers if the field returns.
          </span>
        </p>
      ) : null}
    </div>
  );
}
