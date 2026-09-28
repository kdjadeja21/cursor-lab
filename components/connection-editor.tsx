"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Gauge,
  Globe,
  LayoutGrid,
  Loader2,
  Play,
  Save,
  Settings2,
  Sparkles,
  Table2,
} from "lucide-react";
import { JsonTree } from "@/components/json-tree";
import { KeyValueEditor } from "@/components/key-value-editor";
import { Badge, MethodBadge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_TIMEOUT_MS,
  MAX_TIMEOUT_MS,
  MIN_TIMEOUT_MS,
  REFRESH_PRESETS,
} from "@/lib/connection";
import { inferSchema } from "@/lib/infer-schema";
import { recommendVisualizations } from "@/lib/recommend";
import { testConnection, type ExecuteResult } from "@/lib/runner";
import { useWorkspace } from "@/lib/store/workspace";
import type { ApiConnection, AuthConfig, HttpMethod, WidgetKind } from "@/lib/types";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const KIND_META: Record<WidgetKind, { label: string; icon: typeof Table2 }> = {
  table: { label: "Table", icon: Table2 },
  kpi: { label: "KPI cards", icon: Gauge },
  cards: { label: "Cards", icon: LayoutGrid },
  chart: { label: "Chart", icon: BarChart3 },
};

export function ConnectionEditor({
  initialConnection,
  mode,
}: {
  initialConnection: ApiConnection;
  mode: "create" | "edit";
}) {
  const { saveConnection, state } = useWorkspace();
  const router = useRouter();
  const [draft, setDraft] = useState<ApiConnection>(initialConnection);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const patch = (changes: Partial<ApiConnection>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setSaved(false);
  };

  const schema = useMemo(
    () => (result?.ok ? inferSchema(result.data) : null),
    [result],
  );
  const recommendations = useMemo(
    () => (schema ? recommendVisualizations(schema) : []),
    [schema],
  );

  const dashboards = state.dashboards;
  const isGraphql = draft.apiType === "graphql";
  const supportsBody =
    !isGraphql && ["POST", "PUT", "PATCH", "DELETE"].includes(draft.method);

  const runTest = async () => {
    if (!draft.url.trim()) {
      setResult({
        ok: false,
        status: null,
        statusText: null,
        durationMs: 0,
        sizeBytes: null,
        contentType: null,
        data: null,
        error: "Enter an endpoint URL before testing.",
      });
      return;
    }
    setTesting(true);
    setResult(await testConnection(draft));
    setTesting(false);
  };

  const handleSave = () => {
    if (!draft.name.trim()) {
      setSaveError("Give the connection a name so you can recognise it later.");
      return;
    }
    if (!draft.url.trim()) {
      setSaveError("An endpoint URL is required.");
      return;
    }
    if (isGraphql && !draft.graphqlQuery.trim()) {
      setSaveError("A GraphQL connection needs a query.");
      return;
    }
    setSaveError(null);
    saveConnection(draft);
    setSaved(true);
    if (mode === "create") router.push(`/connections/${draft.id}`);
  };

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader
          icon={<Settings2 className="size-3.5" aria-hidden />}
          title="Request"
          description="Requests run on the server, so the browser never calls the endpoint directly."
          actions={
            <>
              <Button size="sm" onClick={runTest} disabled={testing}>
                {testing ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Play className="size-3.5" aria-hidden />
                )}
                Test
              </Button>
              <Button size="sm" variant="primary" onClick={handleSave}>
                <Save className="size-3.5" aria-hidden />
                Save
              </Button>
            </>
          }
        />

        <div className="flex flex-col gap-5 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Connection name"
              placeholder="Sales API"
              value={draft.name}
              onChange={(event) => patch({ name: event.target.value })}
            />
            <SelectField
              label="API type"
              value={draft.apiType}
              onChange={(event) =>
                patch({
                  apiType: event.target.value as ApiConnection["apiType"],
                })
              }
            >
              <option value="rest">REST</option>
              <option value="graphql">GraphQL</option>
            </SelectField>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_7.5rem]">
            <TextField
              label="Endpoint URL"
              placeholder="https://api.example.com/orders"
              adornment={<Globe className="size-3.5" aria-hidden />}
              value={draft.url}
              onChange={(event) => patch({ url: event.target.value })}
              hint="http and https only. Private and link-local addresses are blocked."
            />
            <SelectField
              label="Method"
              value={isGraphql ? "POST" : draft.method}
              disabled={isGraphql}
              onChange={(event) =>
                patch({ method: event.target.value as HttpMethod })
              }
            >
              {METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="rounded-xl border border-line bg-surface-muted/40 p-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Authentication"
                value={draft.auth.kind}
                onChange={(event) => {
                  const kind = event.target.value as AuthConfig["kind"];
                  if (kind === "none") patch({ auth: { kind: "none" } });
                  if (kind === "bearer") {
                    patch({ auth: { kind: "bearer", token: "" } });
                  }
                  if (kind === "apiKey") {
                    patch({
                      auth: { kind: "apiKey", headerName: "X-API-Key", value: "" },
                    });
                  }
                }}
              >
                <option value="none">None</option>
                <option value="apiKey">API key header</option>
                <option value="bearer">Bearer token</option>
              </SelectField>

              {draft.auth.kind === "bearer" ? (
                <TextField
                  label="Bearer token"
                  type="password"
                  autoComplete="off"
                  placeholder="••••••••"
                  value={draft.auth.token}
                  onChange={(event) =>
                    patch({ auth: { kind: "bearer", token: event.target.value } })
                  }
                />
              ) : null}

              {draft.auth.kind === "apiKey" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Header name"
                    value={draft.auth.headerName}
                    onChange={(event) =>
                      patch({
                        auth: {
                          kind: "apiKey",
                          headerName: event.target.value,
                          value:
                            draft.auth.kind === "apiKey" ? draft.auth.value : "",
                        },
                      })
                    }
                  />
                  <TextField
                    label="Key"
                    type="password"
                    autoComplete="off"
                    placeholder="••••••••"
                    value={draft.auth.value}
                    onChange={(event) =>
                      patch({
                        auth: {
                          kind: "apiKey",
                          headerName:
                            draft.auth.kind === "apiKey"
                              ? draft.auth.headerName
                              : "X-API-Key",
                          value: event.target.value,
                        },
                      })
                    }
                  />
                </div>
              ) : null}
            </div>
            {draft.auth.kind !== "none" ? (
              <p className="mt-3 text-[11px] leading-relaxed text-ink-subtle">
                Credentials are sent as headers by the server and never appear in a
                URL. Without a backend they are stored in this browser.
              </p>
            ) : null}
          </div>

          <KeyValueEditor
            legend="Headers"
            rows={draft.headers}
            onChange={(headers) => patch({ headers })}
            keyPlaceholder="Accept"
            valuePlaceholder="application/json"
          />

          {isGraphql ? (
            <>
              <TextAreaField
                label="GraphQL query"
                rows={6}
                spellCheck={false}
                placeholder={
                  "query Catalog($limit: Int) {\n  catalog { products { sku } }\n}"
                }
                value={draft.graphqlQuery}
                onChange={(event) => patch({ graphqlQuery: event.target.value })}
              />
              <TextAreaField
                label="Variables (JSON)"
                rows={3}
                spellCheck={false}
                placeholder={'{ "limit": 10 }'}
                value={draft.graphqlVariables}
                onChange={(event) =>
                  patch({ graphqlVariables: event.target.value })
                }
              />
            </>
          ) : (
            <>
              <KeyValueEditor
                legend="Query parameters"
                rows={draft.queryParams}
                onChange={(queryParams) => patch({ queryParams })}
                keyPlaceholder="limit"
                valuePlaceholder="50"
              />
              {supportsBody ? (
                <TextAreaField
                  label="Request body (JSON)"
                  rows={5}
                  spellCheck={false}
                  placeholder={'{ "from": "2026-01-01" }'}
                  value={draft.body}
                  onChange={(event) => patch({ body: event.target.value })}
                />
              ) : null}
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Timeout (ms)"
              type="number"
              min={MIN_TIMEOUT_MS}
              max={MAX_TIMEOUT_MS}
              value={draft.timeoutMs}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                patch({
                  timeoutMs: Number.isFinite(parsed)
                    ? Math.min(Math.max(parsed, MIN_TIMEOUT_MS), MAX_TIMEOUT_MS)
                    : DEFAULT_TIMEOUT_MS,
                });
              }}
            />
            <SelectField
              label="Refresh schedule"
              value={
                draft.refreshSeconds === null
                  ? "manual"
                  : String(draft.refreshSeconds)
              }
              onChange={(event) =>
                patch({
                  refreshSeconds:
                    event.target.value === "manual"
                      ? null
                      : Number(event.target.value),
                })
              }
              hint="Scheduled refresh runs while a Fetchboard tab is open."
            >
              {REFRESH_PRESETS.map((preset) => (
                <option
                  key={preset.label}
                  value={
                    preset.seconds === null ? "manual" : String(preset.seconds)
                  }
                >
                  {preset.label}
                </option>
              ))}
            </SelectField>
          </div>

          {saveError ? (
            <p
              role="alert"
              className="flex items-center gap-1.5 rounded-lg border border-danger/25 bg-danger-soft px-2.5 py-2 text-xs text-danger"
            >
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              {saveError}
            </p>
          ) : null}
          {saved ? (
            <p className="flex items-center gap-1.5 rounded-lg border border-positive/25 bg-positive-soft px-2.5 py-2 text-xs text-positive">
              <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
              Connection saved.
            </p>
          ) : null}
        </div>
      </Card>

      <Card className="lg:sticky lg:top-20">
        <CardHeader
          icon={<Sparkles className="size-3.5" aria-hidden />}
          title="Response explorer"
          description={
            result
              ? undefined
              : "Test the request to inspect the response and see suggested views."
          }
          actions={
            result ? (
              result.ok ? (
                <Badge tone="positive" dot>
                  {result.status} OK · {result.durationMs} ms
                </Badge>
              ) : (
                <Badge tone="danger" dot>
                  {result.status ? `${result.status} failed` : "Request failed"}
                </Badge>
              )
            ) : null
          }
        />

        <div className="flex flex-col gap-4 p-4">
          {result ? (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-subtle">
              <MethodBadge method={isGraphql ? "POST" : draft.method} />
              <span className="max-w-full truncate font-mono">
                {draft.url || "no URL"}
              </span>
              {result.sizeBytes !== null ? (
                <span>· {(result.sizeBytes / 1000).toFixed(1)} kB</span>
              ) : null}
              {result.contentType ? (
                <span>· {result.contentType.split(";")[0]}</span>
              ) : null}
            </div>
          ) : null}

          {testing && !result ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-24" />
            </div>
          ) : null}

          {!result && !testing ? (
            <EmptyState
              icon={<Sparkles className="size-5" aria-hidden />}
              title="No response yet"
              description="Fetchboard inspects the JSON you get back, infers its shape, and suggests views that fit — including image galleries when it finds image URLs."
              className="py-10"
            />
          ) : null}

          {result && !result.ok ? (
            <div className="rounded-xl border border-danger/25 bg-danger-soft p-3">
              <p className="flex items-start gap-2 text-xs leading-relaxed text-danger">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>{result.error}</span>
              </p>
              {result.data !== null && result.data !== undefined ? (
                <pre className="scroll-slim mt-2 max-h-40 overflow-auto rounded-lg bg-surface p-2 font-mono text-[11px] text-ink-muted">
                  {JSON.stringify(result.data, null, 2).slice(0, 2000)}
                </pre>
              ) : null}
            </div>
          ) : null}

          {schema ? (
            <>
              <div>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Response structure
                </h3>
                <JsonTree schema={schema} className="max-h-72" />
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Suggested visualizations
                </h3>
                {recommendations.length === 0 ? (
                  <p className="text-xs leading-relaxed text-ink-muted">
                    Fetchboard could not find a shape it knows how to chart. Tables
                    and cards still work if you pick fields manually in the widget
                    builder.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {recommendations.slice(0, 5).map((recommendation, index) => {
                      const meta = KIND_META[recommendation.kind];
                      const Icon = meta.icon;
                      return (
                        <li
                          key={recommendation.id}
                          className="flex items-start gap-2.5 rounded-xl border border-line bg-surface p-2.5 shadow-xs"
                        >
                          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                            <Icon className="size-3.5" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold">
                                {recommendation.title}
                              </span>
                              {index === 0 ? (
                                <Badge tone="brand">Best fit</Badge>
                              ) : (
                                <Badge>
                                  {recommendation.chartType ?? meta.label}
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                              {recommendation.reason}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-line bg-surface-muted/50 p-3">
                <p className="text-xs leading-relaxed text-ink-muted">
                  {mode === "create"
                    ? "Save the connection, then add a widget from a dashboard to pick one of these views."
                    : dashboards.length === 0
                      ? "Create a dashboard to turn this response into widgets."
                      : "Add a widget to a dashboard to choose and configure one of these views."}
                </p>
                {mode === "edit" && dashboards.length > 0 ? (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {dashboards.slice(0, 4).map((dashboard) => (
                      <Link
                        key={dashboard.id}
                        href={`/dashboards/${dashboard.id}/widgets/new?connectionId=${draft.id}`}
                        className={buttonClasses({ size: "sm" })}
                      >
                        Add to {dashboard.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
                {mode === "edit" && dashboards.length === 0 ? (
                  <Link
                    href="/dashboards/new"
                    className={buttonClasses({ size: "sm", className: "mt-2.5" })}
                  >
                    Create a dashboard
                  </Link>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
