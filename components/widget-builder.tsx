"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2, RefreshCw, Save, Wand2 } from "lucide-react";
import { FieldPicker } from "@/components/field-picker";
import { JsonTree } from "@/components/json-tree";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectField, TextField } from "@/components/ui/field";
import { WidgetView } from "@/components/widgets/widget-view";
import {
  candidateFields,
  findNode,
  findTabularArrays,
  findScalars,
  inferSchema,
  pathLabel,
  type FieldSummary,
  type SchemaNode,
} from "@/lib/infer-schema";
import { emptyConfigFor, recommendVisualizations } from "@/lib/recommend";
import { useRefresh } from "@/lib/store/refresh";
import { useWorkspace } from "@/lib/store/workspace";
import type {
  Aggregation,
  ChartType,
  Widget,
  WidgetConfig,
  WidgetKind,
} from "@/lib/types";

const KIND_OPTIONS: { kind: WidgetKind; label: string }[] = [
  { kind: "table", label: "Table" },
  { kind: "kpi", label: "KPI cards" },
  { kind: "cards", label: "Cards" },
  { kind: "chart", label: "Chart" },
];

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie / donut" },
];

const AGGREGATIONS: { value: Aggregation; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "count", label: "Count of rows" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
  { value: "none", label: "No grouping" },
];

const WIDTHS: Widget["width"][] = [1, 2, 3, 4];
const HEIGHTS: Widget["height"][] = ["sm", "md", "lg"];

function defaultSourcePath(schema: SchemaNode | null) {
  if (!schema) return [];
  const tables = findTabularArrays(schema);
  return tables.length > 0 ? tables[0].node.path : [];
}

/** Re-seeds a blank config with a sensible data source for the chosen view. */
function seedConfig(kind: WidgetKind, schema: SchemaNode | null): WidgetConfig {
  const config = emptyConfigFor(kind);
  const sourcePath = defaultSourcePath(schema);

  switch (config.kind) {
    case "table":
      return { ...config, sourcePath };
    case "cards":
      return { ...config, sourcePath };
    case "chart":
      return { ...config, sourcePath };
    case "kpi": {
      const scalars = schema ? findScalars(schema) : [];
      return {
        ...config,
        metrics: scalars
          .filter((scalar) => scalar.kind === "number")
          .slice(0, 4)
          .map((scalar) => ({
            path: scalar.path,
            label: pathLabel(scalar.path),
            format: { kind: "auto" as const },
          })),
      };
    }
    default: {
      const exhaustive: never = config;
      throw new Error(`Unsupported config: ${JSON.stringify(exhaustive)}`);
    }
  }
}

function ConfigEditor({
  config,
  schema,
  onChange,
}: {
  config: WidgetConfig;
  schema: SchemaNode;
  onChange: (config: WidgetConfig) => void;
}) {
  const sourcePath = config.kind === "kpi" ? [] : config.sourcePath;
  const sourceNode = findNode(schema, sourcePath);
  const fields = candidateFields(sourceNode);
  const scalarFields: FieldSummary[] = findScalars(schema).map((scalar) => ({
    path: scalar.path,
    label: pathLabel(scalar.path),
    kind: scalar.kind,
    distinctCount: 1,
    filledCount: 1,
    numeric: null,
  }));

  const sourceSelector =
    config.kind === "kpi" ? null : (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink-muted">Data source</span>
        <p className="text-xs text-ink-subtle">
          Selected:{" "}
          <span className="font-mono">{pathLabel(sourcePath)}</span>
          {sourceNode?.itemCount !== null && sourceNode?.itemCount !== undefined
            ? ` · ${sourceNode.itemCount} items`
            : ""}
        </p>
        <JsonTree
          schema={schema}
          selectedPath={sourcePath}
          className="max-h-52"
          onSelect={(node) => {
            switch (config.kind) {
              case "table":
                onChange({ ...config, sourcePath: node.path, columns: [], sort: null });
                break;
              case "cards":
                onChange({ ...config, sourcePath: node.path, fields: [] });
                break;
              case "chart":
                onChange({
                  ...config,
                  sourcePath: node.path,
                  dimension: { path: [], label: "", format: { kind: "auto" } },
                  measures: [],
                });
                break;
              default: {
                const exhaustive: never = config;
                throw new Error(`Unsupported config: ${JSON.stringify(exhaustive)}`);
              }
            }
          }}
        />
      </div>
    );

  switch (config.kind) {
    case "table":
      return (
        <div className="flex flex-col gap-4">
          {sourceSelector}
          <FieldPicker
            legend="Columns"
            hint="Click a field to add or remove it. Drag order is set with the arrows."
            candidates={fields}
            selected={config.columns}
            onChange={(columns) => onChange({ ...config, columns })}
          />
          <TextField
            label="Rows per page"
            type="number"
            min={1}
            max={100}
            value={config.pageSize}
            onChange={(event) =>
              onChange({
                ...config,
                pageSize: Math.min(100, Math.max(1, Number(event.target.value) || 10)),
              })
            }
          />
        </div>
      );

    case "kpi":
      return (
        <FieldPicker
          legend="Metrics"
          hint="Values outside any list can be shown as KPI cards."
          candidates={scalarFields}
          selected={config.metrics}
          onChange={(metrics) => onChange({ ...config, metrics })}
        />
      );

    case "cards":
      return (
        <div className="flex flex-col gap-4">
          {sourceSelector}
          <FieldPicker
            legend="Fields"
            candidates={fields}
            selected={config.fields}
            onChange={(selected) => onChange({ ...config, fields: selected })}
          />
          <TextField
            label="Maximum cards"
            type="number"
            min={1}
            max={24}
            value={config.maxCards}
            onChange={(event) =>
              onChange({
                ...config,
                maxCards: Math.min(24, Math.max(1, Number(event.target.value) || 6)),
              })
            }
          />
        </div>
      );

    case "chart": {
      const dimensionValue = pathLabel(config.dimension.path);
      const measurePaths = new Set(
        config.measures.map((measure) => pathLabel(measure.path)),
      );
      return (
        <div className="flex flex-col gap-4">
          {sourceSelector}
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Chart type"
              value={config.chartType}
              onChange={(event) =>
                onChange({
                  ...config,
                  chartType: event.target.value as ChartType,
                })
              }
            >
              {CHART_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Combine repeated values"
              value={config.aggregation}
              onChange={(event) =>
                onChange({
                  ...config,
                  aggregation: event.target.value as Aggregation,
                })
              }
            >
              {AGGREGATIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
          </div>

          <SelectField
            label="Dimension (x axis)"
            value={dimensionValue}
            onChange={(event) => {
              const candidate = fields.find(
                (field) => pathLabel(field.path) === event.target.value,
              );
              onChange({
                ...config,
                dimension: candidate
                  ? {
                      path: candidate.path,
                      label: candidate.label,
                      format: {
                        kind: candidate.kind === "date" ? "date" : "auto",
                      },
                    }
                  : { path: [], label: "", format: { kind: "auto" } },
              });
            }}
          >
            <option value="">Choose a field…</option>
            {fields
              .filter((field) => !measurePaths.has(pathLabel(field.path)))
              .map((field) => (
                <option key={pathLabel(field.path)} value={pathLabel(field.path)}>
                  {pathLabel(field.path)} · {field.kind} ·{" "}
                  {field.distinctCount} distinct
                </option>
              ))}
          </SelectField>

          <FieldPicker
            legend="Measures (y axis)"
            hint="Numeric fields only. Pie charts use the first measure."
            candidates={fields.filter((field) => field.kind === "number")}
            selected={config.measures}
            onChange={(measures) => onChange({ ...config, measures })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Sort"
              value={
                config.sort
                  ? `${config.sort.by}:${config.sort.direction}`
                  : "none"
              }
              onChange={(event) => {
                if (event.target.value === "none") {
                  onChange({ ...config, sort: null });
                  return;
                }
                const [by, direction] = event.target.value.split(":");
                onChange({
                  ...config,
                  sort: {
                    by: by as "dimension" | "measure",
                    direction: direction as "asc" | "desc",
                  },
                });
              }}
            >
              <option value="none">Response order</option>
              <option value="dimension:asc">Dimension ascending</option>
              <option value="dimension:desc">Dimension descending</option>
              <option value="measure:desc">Measure high to low</option>
              <option value="measure:asc">Measure low to high</option>
            </SelectField>
            <TextField
              label="Maximum points"
              type="number"
              min={2}
              max={500}
              value={config.maxPoints}
              onChange={(event) =>
                onChange({
                  ...config,
                  maxPoints: Math.min(
                    500,
                    Math.max(2, Number(event.target.value) || 50),
                  ),
                })
              }
            />
          </div>
        </div>
      );
    }

    default: {
      const exhaustive: never = config;
      throw new Error(`Unsupported config: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export function WidgetBuilder({
  dashboardId,
  widget,
  initialConnectionId,
}: {
  dashboardId: string;
  widget?: Widget;
  initialConnectionId?: string;
}) {
  const { state, addWidget, updateWidget } = useWorkspace();
  const { pending, refresh } = useRefresh();
  const router = useRouter();

  const [connectionId, setConnectionId] = useState(
    widget?.connectionId ??
      initialConnectionId ??
      state.connections[0]?.id ??
      "",
  );
  const [config, setConfig] = useState<WidgetConfig | null>(
    widget?.config ?? null,
  );
  const [title, setTitle] = useState(widget?.title ?? "");
  const [width, setWidth] = useState<Widget["width"]>(widget?.width ?? 2);
  const [height, setHeight] = useState<Widget["height"]>(widget?.height ?? "md");
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const entry = state.cache[connectionId];
  const hasData = entry?.data !== null && entry?.data !== undefined;
  const isFetching = Boolean(pending[connectionId]);

  const schema = useMemo(
    () => (hasData ? inferSchema(entry?.data) : null),
    [entry?.data, hasData],
  );
  const recommendations = useMemo(
    () => (schema ? recommendVisualizations(schema) : []),
    [schema],
  );

  if (state.connections.length === 0) {
    return (
      <EmptyState
        title="No connections to build from"
        description="Add an API connection first, then come back to turn its response into a widget."
      />
    );
  }

  const save = () => {
    if (!config) return;
    const resolvedTitle = title.trim() || "Untitled widget";
    if (widget) {
      updateWidget(widget.id, {
        connectionId,
        title: resolvedTitle,
        width,
        height,
        config,
      });
    } else {
      addWidget({
        dashboardId,
        connectionId,
        title: resolvedTitle,
        width,
        height,
        config,
      });
    }
    router.push(`/dashboards/${dashboardId}/edit`);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader
            title="Data source"
            description="Widgets read from a connection's most recent successful response."
            actions={
              <Button
                size="sm"
                onClick={() => void refresh(connectionId)}
                disabled={isFetching || !connectionId}
              >
                {isFetching ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-3.5" aria-hidden />
                )}
                Fetch now
              </Button>
            }
          />
          <div className="flex flex-col gap-4 p-4">
            <SelectField
              label="Connection"
              value={connectionId}
              onChange={(event) => {
                setConnectionId(event.target.value);
                setConfig(null);
                setAppliedId(null);
              }}
            >
              {state.connections.map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {connection.name} ({connection.apiType.toUpperCase()})
                </option>
              ))}
            </SelectField>

            {entry?.error ? (
              <p className="rounded-md border border-danger/25 bg-danger-soft px-2 py-1.5 text-xs text-danger">
                {entry.error}
              </p>
            ) : null}

            {!hasData ? (
              <p className="text-xs text-ink-muted">
                {isFetching
                  ? "Fetching a sample response…"
                  : "Fetch a sample response so Fetchboard can inspect its shape."}
              </p>
            ) : null}
          </div>
        </Card>

        {schema ? (
          <Card>
            <CardHeader
              title="Suggested views"
              description="Based on the response shape and field types. Pick one to prefill the mapping."
            />
            <div className="flex flex-col gap-2 p-4">
              {recommendations.length === 0 ? (
                <p className="text-xs text-ink-muted">
                  No automatic suggestion fits this response. Choose a view below
                  and map the fields yourself.
                </p>
              ) : (
                recommendations.map((recommendation) => (
                  <button
                    key={recommendation.id}
                    type="button"
                    onClick={() => {
                      setConfig(recommendation.config);
                      setTitle(recommendation.title);
                      setAppliedId(recommendation.id);
                    }}
                    aria-pressed={appliedId === recommendation.id}
                    className={
                      appliedId === recommendation.id
                        ? "rounded-lg border border-brand bg-brand-soft p-2.5 text-left"
                        : "rounded-lg border border-line p-2.5 text-left hover:bg-surface-muted"
                    }
                  >
                    <span className="flex items-center gap-2">
                      <Badge tone="brand">
                        {recommendation.chartType ?? recommendation.kind}
                      </Badge>
                      <span className="text-xs font-medium">
                        {recommendation.title}
                      </span>
                    </span>
                    <span className="mt-1 block text-[11px] text-ink-muted">
                      {recommendation.reason}
                    </span>
                  </button>
                ))
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <span className="text-xs text-ink-muted">Or start from:</span>
                {KIND_OPTIONS.map((option) => (
                  <Button
                    key={option.kind}
                    size="sm"
                    onClick={() => {
                      setConfig(seedConfig(option.kind, schema));
                      setAppliedId(null);
                      if (!title.trim()) setTitle(option.label);
                    }}
                  >
                    <Wand2 className="size-3.5" aria-hidden />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        ) : null}

        {schema && config ? (
          <Card>
            <CardHeader title="Fields and formatting" />
            <div className="flex flex-col gap-4 p-4">
              <ConfigEditor config={config} schema={schema} onChange={setConfig} />
            </div>
          </Card>
        ) : null}
      </div>

      <div className="flex flex-col gap-5 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader
            title="Preview"
            description={
              config
                ? "Rendered from the latest fetched response."
                : "Choose a view to see it here."
            }
          />
          <div className="min-h-48 p-4">
            {config && hasData ? (
              <WidgetView config={config} data={entry?.data} />
            ) : (
              <p className="text-xs text-ink-muted">
                Nothing to preview yet.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Widget settings" />
          <div className="flex flex-col gap-4 p-4">
            <TextField
              label="Widget title"
              value={title}
              placeholder="Revenue by region"
              onChange={(event) => setTitle(event.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Width"
                value={String(width)}
                onChange={(event) =>
                  setWidth(Number(event.target.value) as Widget["width"])
                }
              >
                {WIDTHS.map((value) => (
                  <option key={value} value={value}>
                    {value} of 4 columns
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Height"
                value={height}
                onChange={(event) =>
                  setHeight(event.target.value as Widget["height"])
                }
              >
                {HEIGHTS.map((value) => (
                  <option key={value} value={value}>
                    {value === "sm" ? "Short" : value === "md" ? "Medium" : "Tall"}
                  </option>
                ))}
              </SelectField>
            </div>
            <Button
              variant="primary"
              onClick={save}
              disabled={!config}
              className="self-start"
            >
              <Save className="size-4" aria-hidden />
              {widget ? "Save changes" : "Add to dashboard"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
