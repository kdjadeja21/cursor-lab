import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "/tmp/fetchboard-download";
const notes = [];
function log(message) {
  notes.push(message);
  console.log(message);
}

const browser = await chromium.launch({
  executablePath: "/usr/local/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  acceptDownloads: true,
});
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));

await mkdir(OUT, { recursive: true });

await page.goto(`${BASE}/sign-in`, { waitUntil: "networkidle" });
await page.evaluate(() => window.localStorage.clear());
await page.goto(`${BASE}/sign-in`, { waitUntil: "networkidle" });
await page.getByLabel("Email").fill("download@fetchboard.test");
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForURL(`${BASE}/`);

await page.goto(`${BASE}/connections/new`, { waitUntil: "networkidle" });
await page.getByLabel("Connection name").fill("Orders");
await page.getByLabel("Endpoint URL").fill(`${BASE}/api/demo/orders`);
await page.getByRole("button", { name: "Test" }).click();
await page.getByText("Suggested visualizations").waitFor({ timeout: 20000 });
await page.getByRole("button", { name: "Save" }).click();
await page.waitForURL(/\/connections\/con_/);

await page.goto(`${BASE}/dashboards/new`, { waitUntil: "networkidle" });
await page.getByLabel("Name").fill("Orders export");
await page.getByRole("button", { name: "Create dashboard" }).click();
await page.waitForURL(/\/dashboards\/dash_.*\/edit/);
const dashboardUrl = page.url().replace(/\/edit$/, "");

await page.getByRole("link", { name: "Add widget" }).first().click();
await page.waitForURL(/\/widgets\/new/);
await page.getByLabel("Connection").selectOption({ label: "Orders (REST)" });
await page.getByRole("button", { name: "Fetch now" }).click();
await page.getByText("Suggested views").waitFor({ timeout: 20000 });
await page.locator("button[aria-pressed]").filter({ hasText: /table/i }).first().click();
await page.locator("table tbody tr").first().waitFor({ timeout: 20000 });
await page.getByLabel("Width").selectOption("4");
await page.getByRole("button", { name: "Add to dashboard" }).click();
await page.waitForURL(/\/edit$/);

await page.goto(dashboardUrl, { waitUntil: "networkidle" });
await page.locator("table tbody tr").first().waitFor({ timeout: 20000 });
const visibleRows = await page.locator("table tbody tr").count();
log(`visible rows: ${visibleRows}`);

await page.getByPlaceholder("Search rows").fill("Ada");
await page.waitForTimeout(200);
const filteredVisible = await page.locator("table tbody tr").count();
log(`visible after Ada filter: ${filteredVisible}`);

await page.getByRole("button", { name: "Download" }).click();
await page.getByRole("menu", { name: "Download table" }).waitFor();
await page.screenshot({ path: `${OUT}/download_menu.png` });

const csvDownload = page.waitForEvent("download");
await page.getByRole("menuitem", { name: "CSV" }).click();
const csv = await csvDownload;
const csvPath = `${OUT}/${csv.suggestedFilename()}`;
await csv.saveAs(csvPath);
const csvText = await (await import("node:fs/promises")).readFile(csvPath, "utf8");
const csvLines = csvText.trim().split(/\r?\n/);
log(`csv file: ${csv.suggestedFilename()} lines: ${csvLines.length}`);
log(`csv header: ${csvLines[0]}`);
if (!csvLines[0].includes("customer") && !csvLines[0].toLowerCase().includes("customer")) {
  throw new Error(`unexpected header ${csvLines[0]}`);
}
if (csvLines.length - 1 !== filteredVisible) {
  throw new Error(`csv rows ${csvLines.length - 1} != filtered visible ${filteredVisible}`);
}
if (!csvText.includes("Ada Lovelace")) throw new Error("csv missing Ada");
if (csvText.includes("Grace Hopper")) throw new Error("csv included a filtered-out customer");

await page.getByPlaceholder("Search rows").fill("");
await page.waitForTimeout(200);
await page.getByRole("button", { name: "Download" }).click();
const xlsxDownload = page.waitForEvent("download");
await page.getByRole("menuitem", { name: "Excel" }).click();
const xlsx = await xlsxDownload;
const xlsxPath = `${OUT}/${xlsx.suggestedFilename()}`;
await xlsx.saveAs(xlsxPath);
const bytes = await (await import("node:fs/promises")).readFile(xlsxPath);
log(`xlsx file: ${xlsx.suggestedFilename()} bytes: ${bytes.length} zip: ${bytes[0] === 0x50 && bytes[1] === 0x4b}`);
if (!(bytes[0] === 0x50 && bytes[1] === 0x4b)) throw new Error("xlsx is not a zip");
const sheet = bytes.toString("utf8");
if (!sheet.includes("ORD-1000")) throw new Error("xlsx missing first order");
const rowMatches = sheet.match(/<row /g) ?? [];
log(`xlsx rows including header: ${rowMatches.length}`);
if (rowMatches.length <= visibleRows) {
  throw new Error(`xlsx exported only the visible page (${rowMatches.length} <= ${visibleRows})`);
}

log(`console errors: ${consoleErrors.length}`);
for (const error of consoleErrors) log(`  ${error}`);
await writeFile(`${OUT}/report.txt`, `${notes.join("\n")}\n`);
await browser.close();
