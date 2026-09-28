export type ApiType = "rest" | "graphql";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type AuthConfig =
  | { kind: "none" }
  | { kind: "apiKey"; headerName: string; value: string }
  | { kind: "bearer"; token: string };

export interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

/**
 * Field paths are stored as segment arrays rather than dotted strings so keys
 * containing dots or brackets stay addressable.
 */
export type FieldPath = string[];

export type FormatKind =
  | "auto"
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "date";

export interface FieldFormat {
  kind: FormatKind;
  currency?: string;
  decimals?: number;
}

export interface FieldMapping {
  path: FieldPath;
  label: string;
  format: FieldFormat;
}

export interface ApiConnection {
  id: string;
  name: string;
  apiType: ApiType;
  url: string;
  method: HttpMethod;
  auth: AuthConfig;
  headers: KeyValue[];
  queryParams: KeyValue[];
  body: string;
  graphqlQuery: string;
  graphqlVariables: string;
  timeoutMs: number;
  /** null means manual refresh only. */
  refreshSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

export type WidgetKind = "table" | "kpi" | "cards" | "chart";

export type ChartType = "line" | "bar" | "area" | "pie";

export interface TableConfig {
  kind: "table";
  /** Path to the array of objects that fills the rows. */
  sourcePath: FieldPath;
  columns: FieldMapping[];
  sort: { path: FieldPath; direction: "asc" | "desc" } | null;
  search: string;
  pageSize: number;
}

export interface KpiConfig {
  kind: "kpi";
  metrics: FieldMapping[];
}

export interface CardsConfig {
  kind: "cards";
  /** Object path for a single card, or array path for one card per item. */
  sourcePath: FieldPath;
  fields: FieldMapping[];
  maxCards: number;
}

export type Aggregation = "none" | "sum" | "avg" | "count" | "min" | "max";

export interface ChartConfig {
  kind: "chart";
  chartType: ChartType;
  sourcePath: FieldPath;
  dimension: FieldMapping;
  measures: FieldMapping[];
  /** How repeated dimension values are combined. */
  aggregation: Aggregation;
  sort: { by: "dimension" | "measure"; direction: "asc" | "desc" } | null;
  maxPoints: number;
}

export type WidgetConfig = TableConfig | KpiConfig | CardsConfig | ChartConfig;

export interface Widget {
  id: string;
  dashboardId: string;
  connectionId: string;
  title: string;
  /** Column span on the 4-column dashboard grid. */
  width: 1 | 2 | 3 | 4;
  height: "sm" | "md" | "lg";
  order: number;
  config: WidgetConfig;
  createdAt: string;
  updatedAt: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CachedResponse {
  connectionId: string;
  /** Last payload that was fetched successfully, kept even after a failed run. */
  data: unknown;
  status: number | null;
  durationMs: number | null;
  fetchedAt: string | null;
  lastAttemptAt: string | null;
  error: string | null;
  failureCount: number;
}

export interface WorkspaceState {
  version: 1;
  dashboards: Dashboard[];
  connections: ApiConnection[];
  widgets: Widget[];
  cache: Record<string, CachedResponse>;
}

export interface Session {
  email: string;
  name: string;
  signedInAt: string;
}
