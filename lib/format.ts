import type { FieldFormat } from "./types.ts";

const MAX_TEXT_LENGTH = 160;

function formatNumber(value: number, decimals: number | undefined) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? (Number.isInteger(value) ? 0 : 2),
  }).format(value);
}

function formatCurrency(
  value: number,
  currency: string | undefined,
  decimals: number | undefined,
) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency && currency.length === 3 ? currency : "USD",
      minimumFractionDigits: decimals ?? 2,
      maximumFractionDigits: decimals ?? 2,
    }).format(value);
  } catch {
    return formatNumber(value, decimals);
  }
}

/**
 * Percent values arrive either as fractions (0.18) or as whole percentages
 * (18). Values at or below 1 are treated as fractions, which matches how rate
 * fields are usually returned.
 */
function formatPercent(value: number, decimals: number | undefined) {
  const fraction = Math.abs(value) <= 1 ? value : value / 100;
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    minimumFractionDigits: decimals ?? 1,
    maximumFractionDigits: decimals ?? 1,
  }).format(fraction);
}

function formatDate(value: unknown) {
  const timestamp =
    typeof value === "number" ? value : Date.parse(String(value));
  if (Number.isNaN(timestamp)) return String(value);
  const date = new Date(timestamp);
  const hasTime =
    typeof value === "number" || /[T ]\d{2}:\d{2}/.test(String(value));
  return hasTime ? date.toLocaleString() : date.toLocaleDateString();
}

function truncate(text: string) {
  return text.length > MAX_TEXT_LENGTH
    ? `${text.slice(0, MAX_TEXT_LENGTH)}…`
    : text;
}

/** Renders any JSON value as display text. Objects are never rendered as HTML. */
export function formatValue(value: unknown, format: FieldFormat): string {
  if (value === null || value === undefined) return "—";

  switch (format.kind) {
    case "number":
      return typeof value === "number"
        ? formatNumber(value, format.decimals)
        : truncate(String(value));
    case "currency":
      return typeof value === "number"
        ? formatCurrency(value, format.currency, format.decimals)
        : truncate(String(value));
    case "percent":
      return typeof value === "number"
        ? formatPercent(value, format.decimals)
        : truncate(String(value));
    case "date":
      return formatDate(value);
    case "text":
      return truncate(typeof value === "string" ? value : JSON.stringify(value));
    case "image":
    case "link":
      // Rendered as an element by the widget; this is the fallback text form.
      return truncate(String(value));
    case "auto":
      if (typeof value === "number") return formatNumber(value, undefined);
      if (typeof value === "boolean") return value ? "Yes" : "No";
      if (typeof value === "string") return truncate(value);
      return truncate(JSON.stringify(value));
    default: {
      const exhaustive: never = format.kind;
      throw new Error(`Unsupported format: ${String(exhaustive)}`);
    }
  }
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export const FORMAT_LABELS: Record<FieldFormat["kind"], string> = {
  auto: "Automatic",
  text: "Text",
  number: "Number",
  currency: "Currency",
  percent: "Percent",
  date: "Date",
  image: "Image",
  link: "Link",
};

/** Numbers read better right-aligned; everything else stays left-aligned. */
export function isNumericFormat(format: FieldFormat) {
  return ["number", "currency", "percent"].includes(format.kind);
}
