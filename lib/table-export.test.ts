import assert from "node:assert/strict";
import test from "node:test";
import type { FieldMapping } from "./types.ts";
import { buildTableExport, toCsv, toXlsx } from "./table-export.ts";

const auto = { kind: "auto" } as const;

const columns: FieldMapping[] = [
  { path: ["id"], label: "Id", format: auto },
  { path: ["status"], label: "Status", format: auto },
  { path: ["amount"], label: "Amount", format: { kind: "currency", currency: "USD" } },
  { path: ["note"], label: "Note", format: auto },
];

test("export keeps numbers numeric and flattens nested values", () => {
  const table = buildTableExport(columns, [
    { id: "ORD-1", status: "pending", amount: 12.5, note: "ok" },
    { id: "ORD-2", status: null, amount: Number.NaN, note: { kind: "gift" } },
  ]);

  assert.deepEqual(table.headers, ["Id", "Status", "Amount", "Note"]);
  assert.deepEqual(table.rows[0], ["ORD-1", "pending", 12.5, "ok"]);
  assert.deepEqual(table.rows[1], ["ORD-2", "", "", '{"kind":"gift"}']);
});

test("csv escapes commas and neutralizes formula-looking text", () => {
  const csv = toCsv({
    headers: ["Name", "Amount"],
    rows: [
      ["Ada, Lovelace", 10],
      ['=HYPERLINK("http://evil")', -2],
    ],
  });

  assert.equal(csv.startsWith("\uFEFF"), true);
  assert.match(csv, /"Ada, Lovelace",10/);
  assert.match(csv, /"'=HYPERLINK\(""http:\/\/evil""\)",-2/);
});

test("xlsx is a zip whose worksheet contains headers and numeric cells", () => {
  const bytes = toXlsx({
    headers: ["Status", "Amount"],
    rows: [["completed", 12.5]],
  });
  const text = new TextDecoder().decode(bytes);

  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);
  assert.match(text, /<t xml:space="preserve">Status<\/t>/);
  assert.match(text, /<v>12\.5<\/v>/);
  assert.match(text, /sheet name="Data"/);
});
