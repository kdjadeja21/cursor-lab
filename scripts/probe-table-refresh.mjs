// Proves table refresh flashes changed cells instead of swapping the grid.
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.OUT_DIR ?? "/tmp/fetchboard-table";
const notes = [];
const consoleErrors = [];

function log(message) {
  notes.push(message);
  console.log(message);
}

const browser = await chromium.launch({
  executablePath: "/usr/local/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));

await mkdir(OUT, { recursive: true });
const shot = async (name) => {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  log(`screenshot: ${OUT}/${name}.png`);
};

await page.goto(`${BASE}/sign-in`, { waitUntil: "networkidle" });
await page.evaluate(() => window.localStorage.clear());
await page.goto(`${BASE}/sign-in`, { waitUntil: "networkidle" });
await page.getByLabel("Email").fill("table@fetchboard.test");
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
await page.getByLabel("Name").fill("Orders table");
await page.getByRole("button", { name: "Create dashboard" }).click();
await page.waitForURL(/\/dashboards\/dash_.*\/edit/);
const dashboardUrl = page.url().replace(/\/edit$/, "");

await page.getByRole("link", { name: "Add widget" }).first().click();
await page.waitForURL(/\/widgets\/new/);
await page.getByLabel("Connection").selectOption({ label: "Orders (REST)" });
await page.getByRole("button", { name: "Fetch now" }).click();
await page.getByText("Suggested views").waitFor({ timeout: 20000 });
const tableSuggestion = page
  .locator("button[aria-pressed]")
  .filter({ hasText: /table/i })
  .first();
await tableSuggestion.click();
await page.locator("table tbody tr").first().waitFor({ timeout: 20000 });
await page.getByLabel("Width").selectOption("4");
await page.getByRole("button", { name: "Add to dashboard" }).click();
await page.waitForURL(/\/edit$/);

await page.goto(dashboardUrl, { waitUntil: "networkidle" });
await page.locator("table tbody tr").first().waitFor({ timeout: 20000 });
await page.getByPlaceholder("Search rows").fill("Ada");
await page.waitForTimeout(200);
const firstIds = await page.locator("table tbody tr").evaluateAll((rows) =>
  rows.map((row) => row.querySelector("td")?.textContent?.trim() ?? ""),
);
const flashesBefore = await page.locator(".cell-updated").count();
log(`rows after search Ada: ${firstIds.length} ids=${firstIds.slice(0, 4).join(",")}`);
log(`cell-updated on first load: ${flashesBefore}`);
await shot("01-table-baseline");

await page.getByRole("button", { name: "Refresh all" }).click();
await page.waitForFunction(
  () => document.querySelectorAll(".cell-updated").length > 0,
  { timeout: 20000 },
);
const flashesAfter = await page.locator(".cell-updated").count();
const announcement = await page.locator("[aria-live='polite']").innerText();
const searchValue = await page.getByPlaceholder("Search rows").inputValue();
const idsAfter = await page.locator("table tbody tr").evaluateAll((rows) =>
  rows.map((row) => row.querySelector("td")?.textContent?.trim() ?? ""),
);
const statusFlashes = await page.locator("td.cell-updated .inline-flex").count();
const skeleton = await page.locator("[class*='shimmer']").count();
log(`cell-updated after refresh: ${flashesAfter}`);
log(`status chips flashing: ${statusFlashes}`);
log(`live region: ${announcement}`);
log(`search still Ada: ${searchValue === "Ada"}`);
log(`row ids still ${idsAfter.join(",")}`);
log(`skeleton during refresh: ${skeleton}`);
await shot("02-table-cell-flash");

if (flashesBefore !== 0) throw new Error("first load should not flash cells");
if (flashesAfter === 0) throw new Error("refresh should flash changed cells");
if (searchValue !== "Ada") throw new Error("search should survive refresh");
if (skeleton > 0) throw new Error("existing table should not swap to a skeleton");
if (idsAfter.join(",") !== firstIds.join(",")) {
  throw new Error("filtered row identities should stay put");
}

log(`console errors: ${consoleErrors.length}`);
for (const error of consoleErrors) log(`  ${error}`);
await writeFile(`${OUT}/report.txt`, `${notes.join("\n")}\n`);
await browser.close();
