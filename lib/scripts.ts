import { EFFORTS } from "@/lib/effort";
import { MODES } from "@/lib/modes";
import type { DiffLine, RunSettings, ToolKind } from "@/lib/transcript";

export type Step =
  | { type: "thinking"; label: string; lines: string[]; ms: number }
  | {
      type: "tool";
      tool: ToolKind;
      title: string;
      target?: string;
      lines: string[];
      meta?: string;
      ms: number;
    }
  | { type: "text"; text: string }
  | { type: "todo"; items: string[]; advanceMs: number }
  | { type: "diff"; file: string; lines: DiffLine[] }
  | { type: "plan"; title: string; steps: string[] }
  | { type: "wait"; ms: number };

type ToolSpec = {
  tool: ToolKind;
  title: string;
  target?: string;
  lines: string[];
  meta?: string;
  ms: number;
};

type ScriptDef = {
  id: string;
  keywords: string[];
  /** Sliced by effort — higher effort shows more of the deliberation. */
  thoughts: string[];
  tools: ToolSpec[];
  lead: string;
  answer: string;
  todos: string[];
  diffs: { file: string; lines: DiffLine[] }[];
  plan: { title: string; steps: string[] };
  closing: string;
};

const d = (type: DiffLine["type"], text: string): DiffLine => ({ type, text });

const SESSION: ScriptDef = {
  id: "session",
  keywords: ["session", "auth", "login", "token", "refresh", "expire", "logout", "jwt"],
  thoughts: [
    "The report says people get logged out mid-form, so this is probably expiry rather than validation.",
    "`getSession` verifies the cookie and returns null the moment `exp` passes — there's no refresh path at all.",
    "Two options: refresh lazily inside `getSession`, or refresh eagerly in middleware. Middleware runs on every request including static assets, so lazy is cheaper.",
    "Concurrent requests would each try to refresh. I'll need a single-flight guard keyed by the session id or we'll thrash the token endpoint.",
    "Rotation means the old refresh token has to stay valid for a short grace window, otherwise a request already in flight fails.",
    "Worth checking whether middleware forwards Set-Cookie — if it doesn't, the refreshed cookie never reaches the browser.",
  ],
  tools: [
    {
      tool: "search",
      title: "Searched codebase",
      target: "session expiry",
      lines: ["lib/auth/session.ts", "lib/auth/cookies.ts", "middleware.ts", "app/(app)/layout.tsx"],
      meta: "11 results",
      ms: 900,
    },
    {
      tool: "read",
      title: "Read",
      target: "lib/auth/session.ts",
      lines: [
        "export async function getSession(request: Request) {",
        "  const token = readCookie(request, SESSION_COOKIE);",
        "  if (!token) return null;",
      ],
      meta: "84 lines",
      ms: 700,
    },
    {
      tool: "read",
      title: "Read",
      target: "middleware.ts",
      lines: ["const session = await getSession(request);", "if (!session) return redirectToLogin(request);"],
      meta: "42 lines",
      ms: 600,
    },
    {
      tool: "search",
      title: "Grepped",
      target: "SESSION_COOKIE",
      lines: ["lib/auth/cookies.ts:7", "lib/auth/session.ts:12", "app/api/auth/route.ts:31"],
      meta: "3 files",
      ms: 550,
    },
    {
      tool: "terminal",
      title: "Ran",
      target: "npm test -- auth",
      lines: ["PASS  tests/auth/session.test.ts", "Tests: 14 passed, 14 total"],
      meta: "exit 0",
      ms: 1600,
    },
  ],
  lead: "Sessions never refresh — `getSession` returns `null` as soon as the JWT's `exp` passes, which is why people get bounced to login mid-form. I'll add a lazy refresh inside `getSession` with a single-flight guard so concurrent requests share one token exchange.",
  answer:
    "Sessions are read in `lib/auth/session.ts`. `getSession` pulls the `orbit_session` cookie, verifies it with `verify()`, and maps the claims onto a `Session`. There's no refresh anywhere: once `exp` passes, verification fails, `getSession` returns `null`, and `middleware.ts` redirects to `/login`. That's the mid-form logout people are hitting. Access tokens are minted with a 15 minute TTL in `app/api/auth/route.ts`, and the refresh token is stored but only ever read on an explicit re-login.",
  todos: [
    "Add a refresh window check to getSession",
    "Write refreshSession with a single-flight guard",
    "Forward Set-Cookie from middleware",
    "Cover the rotation grace window with a test",
  ],
  diffs: [
    {
      file: "lib/auth/session.ts",
      lines: [
        d("context", "export async function getSession(request: Request) {"),
        d("context", "  const token = readCookie(request, SESSION_COOKIE);"),
        d("context", "  if (!token) return null;"),
        d("context", ""),
        d("remove", "  const claims = await verify(token);"),
        d("remove", "  if (!claims) return null;"),
        d("add", "  const claims = await verify(token, { tolerateExpiry: true });"),
        d("add", "  if (!claims) return null;"),
        d("add", ""),
        d("add", "  const secondsLeft = claims.exp - Date.now() / 1000;"),
        d("add", "  if (secondsLeft < REFRESH_WINDOW_SECONDS) {"),
        d("add", "    return refreshSession(claims, request);"),
        d("add", "  }"),
        d("context", ""),
        d("context", "  return toSession(claims);"),
        d("context", "}"),
      ],
    },
    {
      file: "lib/auth/refresh.ts",
      lines: [
        d("add", "const inFlight = new Map<string, Promise<Session | null>>();"),
        d("add", ""),
        d("add", "export function refreshSession(claims: Claims, request: Request) {"),
        d("add", "  const existing = inFlight.get(claims.sid);"),
        d("add", "  if (existing) return existing;"),
        d("add", ""),
        d("add", "  const pending = exchange(claims, request).finally(() => {"),
        d("add", "    inFlight.delete(claims.sid);"),
        d("add", "  });"),
        d("add", ""),
        d("add", "  inFlight.set(claims.sid, pending);"),
        d("add", "  return pending;"),
        d("add", "}"),
      ],
    },
  ],
  plan: {
    title: "Lazy session refresh with single-flight rotation",
    steps: [
      "Verify with `tolerateExpiry` in `lib/auth/session.ts` so expired-but-signed tokens can still be refreshed.",
      "Add `lib/auth/refresh.ts` holding an in-flight map keyed by `claims.sid`, so parallel requests await one exchange.",
      "Refresh when fewer than 120 seconds remain, and keep the previous refresh token valid for a 30 second grace window.",
      "Forward `Set-Cookie` out of `middleware.ts` so the rotated cookie reaches the browser.",
      "Cover the grace window and the concurrent-refresh case in `tests/auth/session.test.ts`.",
    ],
  },
  closing:
    "Sessions now rotate silently in the background. The grace window keeps requests that were already in flight from failing during rotation.",
};

const FLAKY: ScriptDef = {
  id: "flaky",
  keywords: ["test", "tests", "flaky", "spec", "ci", "failing", "fails", "suite"],
  thoughts: [
    "A test that only fails in CI is usually timing or ordering, not logic.",
    "`checkout.spec.ts` waits on a fixed 200ms timeout after clicking Pay — that's a race against the mocked network.",
    "CI machines are slower and run four workers in parallel, so 200ms is sometimes not enough.",
    "Replacing the sleep with an assertion that retries removes the guess entirely.",
    "The shared `seedCart` fixture also mutates module state, which would explain the ordering sensitivity between workers.",
  ],
  tools: [
    {
      tool: "terminal",
      title: "Ran",
      target: "npx playwright test checkout --repeat-each=8",
      lines: [
        "✓ 6 passed",
        "✘ checkout › applies a discount code (timeout 200ms exceeded)",
        "2 flaky",
      ],
      meta: "exit 1",
      ms: 2200,
    },
    {
      tool: "read",
      title: "Read",
      target: "tests/checkout.spec.ts",
      lines: ["await page.getByRole('button', { name: 'Pay' }).click();", "await page.waitForTimeout(200);"],
      meta: "132 lines",
      ms: 700,
    },
    {
      tool: "search",
      title: "Grepped",
      target: "waitForTimeout",
      lines: ["tests/checkout.spec.ts:71", "tests/checkout.spec.ts:104", "tests/billing.spec.ts:38"],
      meta: "3 matches",
      ms: 500,
    },
    {
      tool: "logs",
      title: "Read CI logs",
      target: "run #4812",
      lines: ["worker 3: retrying checkout › applies a discount code", "flake rate 18% over 50 runs"],
      meta: "2 artifacts",
      ms: 900,
    },
    {
      tool: "terminal",
      title: "Ran",
      target: "npx playwright test checkout --repeat-each=20",
      lines: ["✓ 20 passed", "0 flaky"],
      meta: "exit 0",
      ms: 2400,
    },
  ],
  lead: "Reproduced it at 18% by repeating the spec. The failure is a fixed `waitForTimeout(200)` after clicking Pay, racing the mocked payment response — CI is slower and runs four workers, so it loses that race. I'll swap the sleeps for retrying assertions and isolate the cart fixture.",
  answer:
    "`tests/checkout.spec.ts` clicks Pay and then calls `page.waitForTimeout(200)` before asserting on the receipt. That's a fixed sleep racing an async mock, so on a loaded CI worker the assertion sometimes runs before the response lands. The suite also shares a `seedCart` fixture that mutates module-level state, which makes results depend on worker ordering. Locally with one worker you'll almost never see either problem.",
  todos: [
    "Replace fixed waits with retrying assertions",
    "Isolate the seedCart fixture per test",
    "Re-run the spec 20× to confirm",
  ],
  diffs: [
    {
      file: "tests/checkout.spec.ts",
      lines: [
        d("context", "  await page.getByRole('button', { name: 'Pay' }).click();"),
        d("remove", "  await page.waitForTimeout(200);"),
        d("remove", "  expect(await page.getByTestId('receipt').isVisible()).toBe(true);"),
        d("add", "  await expect(page.getByTestId('receipt')).toBeVisible();"),
        d("context", ""),
        d("remove", "  await page.waitForTimeout(200);"),
        d("remove", "  expect(await total.textContent()).toBe('$41.00');"),
        d("add", "  await expect(total).toHaveText('$41.00');"),
        d("context", "});"),
      ],
    },
    {
      file: "tests/fixtures/cart.ts",
      lines: [
        d("remove", "export const seedCart = buildCart();"),
        d("add", "export const seedCart = () => buildCart();"),
      ],
    },
  ],
  plan: {
    title: "De-flake the checkout suite",
    steps: [
      "Reproduce with `--repeat-each=20` to get a real flake rate before changing anything.",
      "Replace every `waitForTimeout` in `tests/checkout.spec.ts` with a retrying `expect` so the wait is bounded by the assertion.",
      "Make `seedCart` a factory so parallel workers stop sharing mutable state.",
      "Sweep `tests/billing.spec.ts` for the same fixed-sleep pattern.",
      "Confirm with 20 repeats locally and one CI run before closing it out.",
    ],
  },
  closing: "Twenty repeats, zero flakes. The billing spec has the same pattern at line 38 if you want it in this pass.",
};

const PERF: ScriptDef = {
  id: "perf",
  keywords: ["slow", "perf", "performance", "optimi", "lag", "jank", "render", "memo", "fast"],
  thoughts: [
    "A 400 row table that stutters on hover usually means every row re-renders on a parent state change.",
    "`DashboardTable` keeps `hoveredRow` in the parent, so hovering re-renders all 400 rows.",
    "Moving hover state into the row and memoising the row component fixes the common case without virtualising.",
    "The `columns` array is rebuilt inline every render too, which breaks any memo I add downstream.",
    "Virtualisation would help beyond ~2k rows, but it changes keyboard and find-in-page behaviour, so not yet.",
  ],
  tools: [
    {
      tool: "read",
      title: "Read",
      target: "components/dashboard/DashboardTable.tsx",
      lines: ["const [hoveredRow, setHoveredRow] = useState<string | null>(null);", "const columns = buildColumns(locale);"],
      meta: "214 lines",
      ms: 800,
    },
    {
      tool: "search",
      title: "Searched codebase",
      target: "DashboardTable usage",
      lines: ["app/(app)/dashboard/page.tsx", "components/dashboard/RowActions.tsx"],
      meta: "6 results",
      ms: 700,
    },
    {
      tool: "terminal",
      title: "Ran",
      target: "npm run bench -- dashboard",
      lines: ["hover interaction  p95 148ms", "mount             p95 620ms"],
      meta: "baseline captured",
      ms: 1800,
    },
    {
      tool: "terminal",
      title: "Ran",
      target: "npm run bench -- dashboard",
      lines: ["hover interaction  p95 11ms", "mount             p95 240ms"],
      meta: "after change",
      ms: 1800,
    },
  ],
  lead: "The hover jank is a parent re-render: `hoveredRow` lives in `DashboardTable`, so moving the mouse re-renders all 400 rows. I'll push hover state down into the row, memoise the row, and hoist the `columns` array out of render. Baseline p95 was 148ms per hover.",
  answer:
    "`DashboardTable` holds `hoveredRow` in parent state and passes `hovered={row.id === hoveredRow}` to every row. Each mouse move sets parent state, so all 400 rows re-render — p95 around 148ms per hover on my measurement. The `columns` array is also rebuilt inline on every render, so any `memo` on the row would be defeated by the new array identity anyway. Nothing here needs virtualisation yet; the row count is small enough that render count is the whole problem.",
  todos: [
    "Move hover state into the row",
    "Memoise DashboardRow",
    "Hoist the columns array out of render",
    "Re-run the benchmark",
  ],
  diffs: [
    {
      file: "components/dashboard/DashboardTable.tsx",
      lines: [
        d("remove", "const [hoveredRow, setHoveredRow] = useState<string | null>(null);"),
        d("remove", "const columns = buildColumns(locale);"),
        d("add", "const columns = useMemo(() => buildColumns(locale), [locale]);"),
        d("context", ""),
        d("context", "return rows.map((row) => ("),
        d("remove", "  <DashboardRow"),
        d("remove", "    hovered={row.id === hoveredRow}"),
        d("remove", "    onHover={setHoveredRow}"),
        d("add", "  <MemoDashboardRow"),
        d("context", "    key={row.id}"),
        d("context", "    row={row}"),
        d("context", "    columns={columns}"),
        d("context", "  />"),
        d("context", "));"),
      ],
    },
    {
      file: "components/dashboard/DashboardRow.tsx",
      lines: [
        d("remove", "function DashboardRow({ row, columns, hovered, onHover }: RowProps) {"),
        d("add", "function DashboardRow({ row, columns }: RowProps) {"),
        d("add", "  const [hovered, setHovered] = useState(false);"),
        d("context", ""),
        d("context", "  return ("),
        d("context", "    <tr"),
        d("add", "      onMouseEnter={() => setHovered(true)}"),
        d("add", "      onMouseLeave={() => setHovered(false)}"),
        d("context", "      data-hovered={hovered}"),
        d("context", "    >"),
        d("context", "}"),
        d("add", ""),
        d("add", "export const MemoDashboardRow = memo(DashboardRow);"),
      ],
    },
  ],
  plan: {
    title: "Fix dashboard hover jank",
    steps: [
      "Capture a baseline with `npm run bench -- dashboard` so the change is measurable.",
      "Move `hovered` into `DashboardRow` and drop the parent's `hoveredRow` state.",
      "Wrap the row in `memo` and hoist `columns` into a `useMemo` so the memo actually holds.",
      "Re-run the benchmark and record the delta in the PR description.",
      "Leave virtualisation alone until row counts pass ~2k; note it as a follow-up.",
    ],
  },
  closing: "Hover p95 went from 148ms to 11ms, and mount dropped to 240ms as a side effect. Virtualisation can wait until rows get past a couple of thousand.",
};

const UPLOAD: ScriptDef = {
  id: "upload",
  keywords: ["upload", "drag", "drop", "file", "image", "attachment", "dropzone"],
  thoughts: [
    "Large uploads failing at the same size every time smells like a body limit rather than a client bug.",
    "The route posts the whole file through a serverless function, which caps out at 4.5MB.",
    "Presigned direct-to-storage uploads sidestep the limit and take load off the function.",
    "The client needs progress events, which means XHR or a fetch stream — plain fetch gives no upload progress.",
    "Retrying a failed part is worth having, since large uploads over flaky connections will drop.",
  ],
  tools: [
    {
      tool: "read",
      title: "Read",
      target: "components/upload/Dropzone.tsx",
      lines: ["const body = new FormData();", "await fetch('/api/upload', { method: 'POST', body });"],
      meta: "96 lines",
      ms: 700,
    },
    {
      tool: "read",
      title: "Read",
      target: "app/api/upload/route.ts",
      lines: ["const form = await request.formData();", "await storage.put(file.name, file);"],
      meta: "48 lines",
      ms: 600,
    },
    {
      tool: "web",
      title: "Checked docs",
      target: "serverless request body limits",
      lines: ["Request bodies are capped at 4.5MB on serverless functions."],
      meta: "1 page",
      ms: 1100,
    },
    {
      tool: "terminal",
      title: "Ran",
      target: "npm run e2e -- upload",
      lines: ["✓ uploads a 42MB file", "✓ resumes after a dropped part"],
      meta: "exit 0",
      ms: 2100,
    },
  ],
  lead: "Uploads die at 4.5MB because the file is posted through a serverless function, and that's the platform's body cap. I'll switch to presigned direct-to-storage uploads with real progress events, keeping the function for issuing the URL only.",
  answer:
    "`Dropzone` builds a `FormData` and posts it to `/api/upload`, which reads `request.formData()` and pipes it into storage. That means the whole file travels through the serverless function, and request bodies there are capped at 4.5MB — which is exactly where your uploads fail. The client also uses `fetch`, which reports no upload progress, so the bar you see is faked with a timer.",
  todos: [
    "Issue presigned URLs from the API route",
    "Upload directly from the client with progress",
    "Retry dropped parts",
    "Cover a 42MB upload in e2e",
  ],
  diffs: [
    {
      file: "app/api/upload/route.ts",
      lines: [
        d("remove", "const form = await request.formData();"),
        d("remove", "const file = form.get('file') as File;"),
        d("remove", "await storage.put(file.name, file);"),
        d("remove", "return Response.json({ ok: true });"),
        d("add", "const { name, size, type } = await request.json();"),
        d("add", "const upload = await storage.createPresignedUpload({ name, size, type });"),
        d("add", "return Response.json({ url: upload.url, fields: upload.fields });"),
      ],
    },
    {
      file: "components/upload/Dropzone.tsx",
      lines: [
        d("remove", "const body = new FormData();"),
        d("remove", "body.append('file', file);"),
        d("remove", "await fetch('/api/upload', { method: 'POST', body });"),
        d("add", "const ticket = await requestUploadTicket(file);"),
        d("add", "await putWithProgress(ticket, file, {"),
        d("add", "  onProgress: (sent) => setProgress(sent / file.size),"),
        d("add", "  retries: 3,"),
        d("add", "});"),
      ],
    },
  ],
  plan: {
    title: "Direct-to-storage uploads with progress",
    steps: [
      "Turn `/api/upload` into a presign endpoint that returns a URL and fields instead of accepting the body.",
      "Add `putWithProgress` using XHR so the client gets real upload progress events.",
      "Retry dropped parts up to three times with backoff before surfacing a failure.",
      "Keep a server-side size and MIME check when issuing the ticket.",
      "Add an e2e case that uploads 42MB and one that resumes after a dropped part.",
    ],
  },
  closing: "A 42MB file now uploads end to end, and the progress bar reflects real bytes instead of a timer.",
};

const GENERIC: ScriptDef = {
  id: "generic",
  keywords: [],
  thoughts: [
    "Let me get my bearings in the repo before proposing anything.",
    "The routing and data layers matter most here, so I'll start with those.",
    "There's an existing pattern for this nearby — matching it beats inventing a second convention.",
    "I should check whether anything else depends on the shape I'm about to change.",
    "Worth confirming the tests cover the path I'm touching before I edit it.",
  ],
  tools: [
    {
      tool: "search",
      title: "Searched codebase",
      target: "relevant modules",
      lines: ["app/(app)/layout.tsx", "lib/config.ts", "components/shell/Sidebar.tsx"],
      meta: "9 results",
      ms: 900,
    },
    {
      tool: "read",
      title: "Read",
      target: "lib/config.ts",
      lines: ["export const config = { features: { ... } }"],
      meta: "63 lines",
      ms: 650,
    },
    {
      tool: "read",
      title: "Read",
      target: "components/shell/Sidebar.tsx",
      lines: ["const items = useNavItems();"],
      meta: "118 lines",
      ms: 700,
    },
    {
      tool: "terminal",
      title: "Ran",
      target: "npm run typecheck",
      lines: ["No errors found."],
      meta: "exit 0",
      ms: 1700,
    },
  ],
  lead: "Had a look through the repo. There's an established pattern for this in `components/shell`, so I'll follow it rather than introduce a second convention, and keep the change confined to the two files that need it.",
  answer:
    "Here's what I found. The shell composes `app/(app)/layout.tsx` with `components/shell/Sidebar.tsx`, and feature visibility is resolved through `lib/config.ts`. Anything user-facing flows through those three files, so that's where a change like this would land.",
  todos: ["Follow the existing shell pattern", "Wire it through config", "Typecheck the change"],
  diffs: [
    {
      file: "components/shell/Sidebar.tsx",
      lines: [
        d("context", "const items = useNavItems();"),
        d("add", ""),
        d("add", "const visible = items.filter((item) => config.features[item.flag] !== false);"),
        d("context", ""),
        d("remove", "return items.map((item) => <NavItem key={item.href} {...item} />);"),
        d("add", "return visible.map((item) => <NavItem key={item.href} {...item} />);"),
      ],
    },
  ],
  plan: {
    title: "Follow the existing shell pattern",
    steps: [
      "Resolve visibility through `lib/config.ts` so there's a single source of truth.",
      "Filter nav items in `components/shell/Sidebar.tsx` rather than at each call site.",
      "Keep the change to those two files and typecheck before handing it back.",
    ],
  },
  closing: "Typecheck is clean. Say the word if you'd rather this lived in the layout instead of the sidebar.",
};

const SCRIPTS: ScriptDef[] = [SESSION, FLAKY, PERF, UPLOAD, GENERIC];

function matchScript(prompt: string): ScriptDef {
  const normalized = prompt.toLowerCase();
  let best = GENERIC;
  let bestHits = 0;
  for (const script of SCRIPTS) {
    const hits = script.keywords.filter((keyword) => normalized.includes(keyword)).length;
    if (hits > bestHits) {
      best = script;
      bestHits = hits;
    }
  }
  return best;
}

const READ_ONLY_TOOLS: ToolKind[] = ["read", "search", "web"];

/**
 * Turns a prompt plus the current control settings into a timed run.
 * Mode decides which artifacts appear, effort decides how much deliberation
 * and how many tool calls, and Fast compresses every duration.
 */
export function buildRun(prompt: string, settings: RunSettings): Step[] {
  const script = matchScript(prompt);
  const mode = MODES[settings.mode];
  const effort = settings.effort;
  const intensity = effort ? EFFORTS[effort].intensity : 0.45;
  const pace = settings.fast ? 0.5 : 1;
  const steps: Step[] = [];

  if (effort !== "none") {
    const thoughtCount = Math.max(
      1,
      Math.round(1 + intensity * (script.thoughts.length - 1)),
    );
    steps.push({
      type: "thinking",
      label: "Thinking",
      lines: script.thoughts.slice(0, thoughtCount),
      ms: Math.round((900 + intensity * 4200) * pace),
    });
  }

  const readOnly = mode.writes === "never" || mode.writes === "after-approval";
  const usableTools = script.tools.filter(
    (tool) => !readOnly || READ_ONLY_TOOLS.includes(tool.tool),
  );
  const toolBudget = Math.max(
    2,
    Math.min(usableTools.length, Math.round(2 + intensity * usableTools.length)),
  );

  if (settings.mode === "debug") {
    steps.push({
      type: "tool",
      tool: "terminal",
      title: "Reproduced",
      target: "npm run dev — captured 3 failing requests",
      lines: ["POST /api/checkout 500", "trace id 9f2c…41", "reproduced 3/5 attempts"],
      meta: "evidence gathered",
      ms: Math.round(1900 * pace),
    });
  }

  for (const tool of usableTools.slice(0, toolBudget)) {
    steps.push({ ...tool, type: "tool", ms: Math.round(tool.ms * pace) });
  }

  if (settings.mode === "ask") {
    steps.push({ type: "text", text: script.answer });
    return steps;
  }

  steps.push({ type: "text", text: script.lead });

  if (settings.mode === "plan") {
    steps.push({ type: "wait", ms: Math.round(420 * pace) });
    steps.push({ type: "plan", title: script.plan.title, steps: script.plan.steps });
    return steps;
  }

  steps.push({
    type: "todo",
    items: script.todos,
    advanceMs: Math.round(760 * pace),
  });

  for (const diff of script.diffs) {
    steps.push({
      type: "tool",
      tool: "edit",
      title: "Edited",
      target: diff.file,
      lines: [],
      meta: `${diff.lines.filter((line) => line.type === "add").length} additions`,
      ms: Math.round(900 * pace),
    });
    steps.push({ type: "diff", file: diff.file, lines: diff.lines });
  }

  steps.push({ type: "text", text: script.closing });
  return steps;
}

/** Steps used when a plan is approved and handed to Agent mode. */
export function buildPlanExecution(prompt: string, settings: RunSettings): Step[] {
  return buildRun(prompt, { ...settings, mode: "agent" });
}

export const SUGGESTIONS = [
  "Why do users get logged out mid-form?",
  "The checkout spec is flaky in CI",
  "The dashboard table janks on hover",
  "Uploads over 5MB fail silently",
];
