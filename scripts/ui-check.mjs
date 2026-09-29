// Local UI harness: drives the app with Chrome over CDP to capture screenshots
// and assert the end-to-end flow. Not part of the app build.
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.OUT_DIR ?? "/tmp/fetchboard-ui";
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
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
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

// Start from a clean workspace so the run is reproducible.
await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => window.localStorage.clear());
await page.goto(`${BASE}/sign-in`, { waitUntil: "networkidle" });
await shot("01-sign-in");

await page.getByLabel("Email").fill("demo@fetchboard.test");
await page.getByLabel("Display name (optional)").fill("Demo User");
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForURL(`${BASE}/`);
log(`signed in, heading: ${await page.getByRole("heading", { level: 1 }).innerText()}`);
await shot("02-home-empty");

// GraphQL connection whose records carry image URLs.
await page.goto(`${BASE}/connections/new`, { waitUntil: "networkidle" });
await page.getByLabel("Connection name").fill("Product Catalog");
await page.getByLabel("API type").selectOption("graphql");
await page.getByLabel("Endpoint URL").fill(`${BASE}/api/demo/graphql`);
await page
  .getByLabel("GraphQL query")
  .fill("{ catalog { products { sku name category price imageUrl unitsSold } } }");
log(
  `method selector disabled for GraphQL: ${await page.getByLabel("Method").isDisabled()}`,
);
await page.getByRole("button", { name: "Test" }).click();
await page.getByText("Suggested visualizations").waitFor({ timeout: 20000 });

const suggestions = await page.locator("h3:text('Suggested visualizations') + ul > li").all();
log(`suggestion count: ${suggestions.length}`);
for (const [index, item] of suggestions.entries()) {
  log(`suggestion ${index + 1}: ${(await item.innerText()).replace(/\n/g, " | ")}`);
}
const imageChips = await page.locator("li >> text=image").count();
log(`nodes labelled image in tree: ${imageChips}`);
await shot("03-graphql-explorer");

await page.getByRole("button", { name: "Save" }).click();
await page.waitForURL(/\/connections\/con_/);
log("graphql connection saved");

// REST connection whose records carry avatar URLs.
await page.goto(`${BASE}/connections/new`, { waitUntil: "networkidle" });
await page.getByLabel("Connection name").fill("Orders");
await page.getByLabel("Endpoint URL").fill(`${BASE}/api/demo/orders`);
await page.getByRole("button", { name: "Test" }).click();
await page.getByText("Suggested visualizations").waitFor({ timeout: 20000 });
const restTop = await page
  .locator("h3:text('Suggested visualizations') + ul > li")
  .first()
  .innerText();
log(`REST top suggestion: ${restTop.replace(/\n/g, " | ")}`);
await page.getByRole("button", { name: "Save" }).click();
await page.waitForURL(/\/connections\/con_/);
await page.goto(`${BASE}/connections`, { waitUntil: "networkidle" });
await shot("04-connections");

// Dashboard with a gallery widget and a chart widget.
await page.goto(`${BASE}/dashboards/new`, { waitUntil: "networkidle" });
await page.getByLabel("Name").fill("Catalog overview");
await page.getByLabel("Description (optional)").fill("Products and orders");
await page.getByRole("button", { name: "Create dashboard" }).click();
await page.waitForURL(/\/dashboards\/dash_.*\/edit/);
const dashboardUrl = page.url().replace(/\/edit$/, "");

await page.getByRole("link", { name: "Add widget" }).first().click();
await page.waitForURL(/\/widgets\/new/);
await page.getByLabel("Connection").selectOption({ label: "Product Catalog (GRAPHQL)" });
await page.getByRole("button", { name: "Fetch now" }).click();
await page.getByText("Suggested views").waitFor({ timeout: 20000 });
const topSuggestion = page.locator('button[aria-pressed]').first();
log(`builder top suggestion: ${(await topSuggestion.innerText()).replace(/\n/g, " | ")}`);
await topSuggestion.click();

await page.getByLabel("Card image").waitFor();
log(`card image field: ${await page.getByLabel("Card image").inputValue()}`);
log(`card heading field: ${await page.getByLabel("Card heading").inputValue()}`);

// Wait for the remote product photos in the preview to finish loading.
await page.waitForFunction(
  () => {
    const images = [...document.querySelectorAll("article img")];
    return images.length > 0 && images.every((image) => image.complete);
  },
  { timeout: 25000 },
);
const imageStats = await page.evaluate(() =>
  [...document.querySelectorAll("article img")].map((image) => ({
    width: image.naturalWidth,
    height: image.naturalHeight,
  })),
);
log(
  `preview images: ${imageStats.length}, loaded with pixels: ${
    imageStats.filter((image) => image.width > 0).length
  }`,
);
await page.getByLabel("Width").selectOption("4");
await shot("05-builder-gallery");
await page.getByRole("button", { name: "Add to dashboard" }).click();
await page.waitForURL(/\/edit$/);

await page.getByRole("link", { name: "Add widget" }).first().click();
await page.waitForURL(/\/widgets\/new/);
await page.getByLabel("Connection").selectOption({ label: "Product Catalog (GRAPHQL)" });
await page.getByText("Suggested views").waitFor({ timeout: 20000 });
const barSuggestion = page
  .locator('button[aria-pressed]')
  .filter({ hasText: "bar" })
  .first();
log(`bar suggestion: ${(await barSuggestion.innerText()).replace(/\n/g, " | ")}`);
await barSuggestion.click();
await page.locator(".recharts-bar-rectangle").first().waitFor({ timeout: 20000 });
log(`bars rendered: ${await page.locator(".recharts-bar-rectangle").count()}`);
await shot("06-builder-chart");
await page.getByRole("button", { name: "Add to dashboard" }).click();
await page.waitForURL(/\/edit$/);
await shot("07-dashboard-editor");

// Viewer, including the custom chart tooltip.
await page.goto(dashboardUrl, { waitUntil: "networkidle" });
await page.waitForFunction(
  () => {
    const images = [...document.querySelectorAll("article img")];
    return images.length > 0 && images.every((image) => image.complete);
  },
  { timeout: 25000 },
);
log(`widget frames on viewer: ${await page.locator("h3").count()}`);
log(`fresh badges: ${await page.getByText("fresh", { exact: true }).count()}`);
await shot("08-dashboard-viewer");

const bar = page.locator(".recharts-bar-rectangle").first();
await bar.hover();
const tooltip = page.locator(".chart-tooltip-shell");
if (await tooltip.count()) {
  log(`tooltip: ${(await tooltip.first().innerText()).replace(/\n/g, " | ")}`);
} else {
  log("tooltip: not rendered");
}

// Error state: point a connection at a missing path and confirm stale data stays.
await page.goto(`${BASE}/connections`, { waitUntil: "networkidle" });
await page.getByRole("link", { name: "Product Catalog" }).click();
await page.waitForURL(/\/connections\/con_/);
await page.getByLabel("Endpoint URL").fill(`${BASE}/api/demo/missing`);
await page.getByRole("button", { name: "Save" }).click();
await page.goto(dashboardUrl, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Refresh all" }).click();
await page.getByText("Showing the last successful data").first().waitFor({ timeout: 20000 });
log(`error badges after failed refresh: ${await page.getByText("error", { exact: true }).count()}`);
log(
  `images still rendered while stale: ${await page.locator("article img").count()}`,
);
await shot("09-stale-error-state");

// Recover, then confirm persistence across a full reload.
await page.goto(`${BASE}/connections`, { waitUntil: "networkidle" });
await page.getByRole("link", { name: "Product Catalog" }).click();
await page.getByLabel("Endpoint URL").fill(`${BASE}/api/demo/graphql`);
await page.getByRole("button", { name: "Save" }).click();
await page.goto(dashboardUrl, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Refresh all" }).click();
await page.waitForTimeout(1500);
await page.reload({ waitUntil: "networkidle" });
log(`after reload, widgets present: ${await page.locator("article, table, .recharts-wrapper").count() > 0}`);

// Mobile width.
await page.setViewportSize({ width: 400, height: 900 });
await page.waitForTimeout(600);
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
log(`horizontal overflow at 400px: ${overflow}px`);
await shot("10-mobile-viewer");

log(`console errors: ${consoleErrors.length}`);
for (const error of consoleErrors) log(`  ${error}`);

await writeFile(`${OUT}/report.txt`, `${notes.join("\n")}\n`);
await browser.close();
