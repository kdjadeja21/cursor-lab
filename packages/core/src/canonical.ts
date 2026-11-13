const LINE_WIDTH = 100;

export function canonicalJson(value: unknown): string {
  return `${formatValue(sortValue(value), 0, 0)}\n`;
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    );
    return Object.fromEntries(entries.map(([key, nested]) => [key, sortValue(nested)]));
  }
  return value;
}

function formatValue(value: unknown, indent: number, column: number): string {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return formatArray(value, indent, column);
  if (typeof value === "object") return formatObject(value as Record<string, unknown>, indent);
  return JSON.stringify(value);
}

function formatArray(values: unknown[], indent: number, column: number): string {
  if (values.length === 0) return "[]";
  const inline = `[${values.map((item) => JSON.stringify(item)).join(", ")}]`;
  if (values.every(isPrimitive) && column + inline.length < LINE_WIDTH) return inline;
  const childIndent = indent + 1;
  const inner = values
    .map((item) => {
      const pad = " ".repeat(childIndent * 2);
      return `${pad}${formatValue(item, childIndent, pad.length)}`;
    })
    .join(",\n");
  return `[\n${inner}\n${" ".repeat(indent * 2)}]`;
}

function formatObject(value: Record<string, unknown>, indent: number): string {
  const keys = Object.keys(value);
  if (keys.length === 0) return "{}";
  const childIndent = indent + 1;
  const inner = keys
    .map((key) => {
      const prefix = `${" ".repeat(childIndent * 2)}${JSON.stringify(key)}: `;
      return `${prefix}${formatValue(value[key], childIndent, prefix.length)}`;
    })
    .join(",\n");
  return `{\n${inner}\n${" ".repeat(indent * 2)}}`;
}

function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}
