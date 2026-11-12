export type RepoEntry = {
  path: string;
  kind: "file" | "folder" | "image";
  hint?: string;
};

/** Stand-in for the workspace index that @-mentions search. */
export const REPO_ENTRIES: RepoEntry[] = [
  { path: "lib/auth/session.ts", kind: "file", hint: "84 lines" },
  { path: "lib/auth/cookies.ts", kind: "file", hint: "31 lines" },
  { path: "middleware.ts", kind: "file", hint: "42 lines" },
  { path: "app/api/auth/route.ts", kind: "file", hint: "77 lines" },
  { path: "components/dashboard/DashboardTable.tsx", kind: "file", hint: "214 lines" },
  { path: "components/dashboard/DashboardRow.tsx", kind: "file", hint: "96 lines" },
  { path: "components/upload/Dropzone.tsx", kind: "file", hint: "96 lines" },
  { path: "app/api/upload/route.ts", kind: "file", hint: "48 lines" },
  { path: "tests/checkout.spec.ts", kind: "file", hint: "132 lines" },
  { path: "tests/fixtures/cart.ts", kind: "file", hint: "24 lines" },
  { path: "lib/config.ts", kind: "file", hint: "63 lines" },
  { path: "components/shell/", kind: "folder", hint: "7 files" },
  { path: "app/(app)/dashboard/", kind: "folder", hint: "4 files" },
  { path: "design/hover-jank.png", kind: "image", hint: "screenshot" },
];

export const SLASH_COMMANDS = [
  { name: "plan", label: "Switch to Plan mode", detail: "Draft an approach before any edits" },
  { name: "agent", label: "Switch to Agent mode", detail: "Full read, write and run" },
  { name: "ask", label: "Switch to Ask mode", detail: "Read-only answers" },
  { name: "debug", label: "Switch to Debug mode", detail: "Gather runtime evidence first" },
  { name: "fast", label: "Toggle Fast", detail: "Priority capacity, 2× usage" },
  { name: "effort", label: "Open the effort dial", detail: "Pick a reasoning level" },
  { name: "clear", label: "New chat", detail: "Clear the transcript" },
] as const;
