// Scratch probe: inspects how the chart preview renders in the widget builder.
import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";

const session = {
  email: "demo@fetchboard.test",
  name: "Demo User",
  signedInAt: new Date().toISOString(),
};

const connection = {
  id: "con_probe",
  name: "Product Catalog",
  apiType: "graphql",
  url: `${BASE}/api/demo/graphql`,
  method: "POST",
  auth: { kind: "none" },
  headers: [],
  queryParams: [],
  body: "",
  graphqlQuery: "{ catalog { products { sku name category price imageUrl unitsSold } } }",
  graphqlVariables: "",
  timeoutMs: 15000,
  refreshSeconds: 300,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const workspace = {
  version: 1,
  dashboards: [
    {
      id: "dash_probe",
      name: "Probe",
      description: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  connections: [connection],
  widgets: [],
  cache: {},
};

const browser = await chromium.launch({
  executablePath: "/usr/local/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("console", (message) => {
  if (message.type() === "error") console.log("console error:", message.text());
});
page.on("pageerror", (error) => console.log("pageerror:", error.message));

await page.addInitScript(
  ([sessionJson, workspaceJson]) => {
    window.localStorage.setItem("fetchboard:session", sessionJson);
    window.localStorage.setItem(
      "fetchboard:v1:demo@fetchboard.test",
      workspaceJson,
    );
  },
  [JSON.stringify(session), JSON.stringify(workspace)],
);

await page.goto(`${BASE}/dashboards/dash_probe/widgets/new`, {
  waitUntil: "networkidle",
});
await page.getByRole("button", { name: "Fetch now" }).click();
await page.getByText("Suggested views").waitFor({ timeout: 20000 });
const bar = page.locator("button[aria-pressed]").filter({ hasText: "bar" }).first();
console.log("bar option:", (await bar.innerText()).replace(/\n/g, " | "));
await bar.click();
await page.waitForTimeout(2500);

const info = await page.evaluate(() => {
  const responsive = document.querySelector(".recharts-responsive-container");
  const svg = document.querySelector(".recharts-surface");
  const box = (element) => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { width: Math.round(rect.width), height: Math.round(rect.height) };
  };
  return {
    svgClasses: [
      ...new Set(
        [...document.querySelectorAll("svg *")]
          .map((node) => node.getAttribute("class"))
          .filter(Boolean),
      ),
    ].slice(0, 25),
    responsiveBox: box(responsive),
    svgBox: box(svg),
    previewPanelText: document
      .querySelector("h2:nth-of-type(1)")
      ?.parentElement?.parentElement?.parentElement?.innerText?.slice(0, 200),
  };
});
console.log(JSON.stringify(info, null, 2));
const chain = await page.evaluate(() => {
  const responsive = document.querySelector(".recharts-responsive-container");
  const out = [];
  let node = responsive;
  while (node && out.length < 8) {
    const style = window.getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    out.push({
      tag: node.tagName,
      className: typeof node.className === "string" ? node.className : "",
      height: Math.round(rect.height),
      computedHeight: style.height,
      minHeight: style.minHeight,
      display: style.display,
      flex: style.flex,
    });
    node = node.parentElement;
  }
  return out;
});
console.log(JSON.stringify(chain, null, 2));
await page.screenshot({ path: "/tmp/fetchboard-ui/probe-chart.png", fullPage: true });
await browser.close();
