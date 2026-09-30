import type { FieldMapping } from "./types.ts";
import { getByPath } from "./infer-schema.ts";

export type ExportCell = string | number;

export interface TabularExport {
  headers: string[];
  rows: ExportCell[][];
}

/** Turns mapped columns into export cells. Numbers stay numeric so a spreadsheet can sum them. */
export function exportCell(value: unknown): ExportCell {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? value : "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function buildTableExport(
  columns: FieldMapping[],
  rows: Record<string, unknown>[],
): TabularExport {
  return {
    headers: columns.map((column) => column.label),
    rows: rows.map((row) =>
      columns.map((column) => exportCell(getByPath(row, column.path))),
    ),
  };
}

function neutralizeFormula(text: string) {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function csvField(value: ExportCell) {
  if (typeof value === "number") return String(value);
  const text = neutralizeFormula(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

/** UTF-8 CSV with a BOM so Excel keeps non-ASCII characters. */
export function toCsv(table: TabularExport) {
  const lines = [
    table.headers.map((header) => csvField(header)).join(","),
    ...table.rows.map((row) => row.map((cell) => csvField(cell)).join(",")),
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function xmlText(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function columnLetter(index: number) {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function sheetXml(table: TabularExport) {
  const allRows = [table.headers, ...table.rows];
  const lastColumn = columnLetter(Math.max(0, table.headers.length - 1));
  const body = allRows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, columnIndex) => {
          const ref = `${columnLetter(columnIndex)}${rowIndex + 1}`;
          if (typeof cell === "number") {
            return `<c r="${ref}"><v>${cell}</v></c>`;
          }
          const text = xmlText(neutralizeFormula(cell));
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}${allRows.length}"/>
  <sheetData>${body}</sheetData>
</worksheet>`;
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const WORKBOOK = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true);
}

function writeUint16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

/** Minimal stored (uncompressed) zip. Excel accepts it as an .xlsx workbook. */
function zipStored(files: { name: string; data: Uint8Array }[]) {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.data);
    const local = new Uint8Array(30 + name.length + file.data.length);
    const localView = new DataView(local.buffer);
    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 8, 0);
    writeUint32(localView, 14, crc);
    writeUint32(localView, 18, file.data.length);
    writeUint32(localView, 22, file.data.length);
    writeUint16(localView, 26, name.length);
    local.set(name, 30);
    local.set(file.data, 30 + name.length);
    locals.push(local);

    const entry = new Uint8Array(46 + name.length);
    const entryView = new DataView(entry.buffer);
    writeUint32(entryView, 0, 0x02014b50);
    writeUint16(entryView, 4, 20);
    writeUint16(entryView, 6, 20);
    writeUint32(entryView, 16, crc);
    writeUint32(entryView, 20, file.data.length);
    writeUint32(entryView, 24, file.data.length);
    writeUint16(entryView, 28, name.length);
    writeUint32(entryView, 42, offset);
    entry.set(name, 46);
    central.push(entry);
    offset += local.length;
  }

  const centralSize = central.reduce((total, entry) => total + entry.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 8, files.length);
  writeUint16(endView, 10, files.length);
  writeUint32(endView, 12, centralSize);
  writeUint32(endView, 16, offset);

  const archive = new Uint8Array(
    offset + centralSize + end.length,
  );
  let cursor = 0;
  for (const part of [...locals, ...central, end]) {
    archive.set(part, cursor);
    cursor += part.length;
  }
  return archive;
}

function utf8(text: string) {
  return new TextEncoder().encode(text);
}

export function toXlsx(table: TabularExport) {
  return zipStored([
    { name: "[Content_Types].xml", data: utf8(CONTENT_TYPES) },
    { name: "_rels/.rels", data: utf8(ROOT_RELS) },
    { name: "xl/workbook.xml", data: utf8(WORKBOOK) },
    { name: "xl/_rels/workbook.xml.rels", data: utf8(WORKBOOK_RELS) },
    { name: "xl/worksheets/sheet1.xml", data: utf8(sheetXml(table)) },
  ]);
}

export function downloadFilename(extension: "csv" | "xlsx") {
  const date = new Date().toISOString().slice(0, 10);
  return `fetchboard-table-${date}.${extension}`;
}
