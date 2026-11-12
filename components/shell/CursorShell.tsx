import type { ReactNode } from "react";
import {
  Bell,
  Blocks,
  Files,
  GitBranch,
  Search,
  Settings,
  Share2,
  CircleCheck,
  LayoutPanelLeft,
  LayoutPanelTop,
  PanelRight,
} from "lucide-react";
import { CursorMark } from "@/components/brand/CursorMark";
import { cn } from "@/lib/cn";

type Tok = { t: string; c?: string };
type Line = Tok[];

const KW = "text-[#c586c0]";
const FN = "text-[#dcdcaa]";
const TY = "text-[#4ec9b0]";
const ST = "text-[#ce9178]";
const VAR = "text-[#9cdcfe]";
const CM = "text-[#6a9955]";
const PN = "text-fg-2";

const CODE: Line[] = [
  [{ t: "import", c: KW }, { t: " { AgentProvider } ", c: VAR }, { t: "from", c: KW }, { t: ' "@/lib/store"', c: ST }, { t: ";", c: PN }],
  [{ t: "import", c: KW }, { t: " { AgentWindow } ", c: VAR }, { t: "from", c: KW }, { t: ' "@/components/agent/AgentWindow"', c: ST }, { t: ";", c: PN }],
  [],
  [{ t: "// The shell is Cursor's brand frame. Only the agent panel is redesigned.", c: CM }],
  [{ t: "export default function", c: KW }, { t: " Home", c: FN }, { t: "() {", c: PN }],
  [{ t: "  return", c: KW }, { t: " (", c: PN }],
  [{ t: "    <", c: PN }, { t: "AgentProvider", c: TY }, { t: ">", c: PN }],
  [{ t: "      <", c: PN }, { t: "CursorShell", c: TY }, { t: ">", c: PN }],
  [{ t: "        <", c: PN }, { t: "AgentWindow", c: TY }, { t: " />", c: PN }],
  [{ t: "      </", c: PN }, { t: "CursorShell", c: TY }, { t: ">", c: PN }],
  [{ t: "    </", c: PN }, { t: "AgentProvider", c: TY }, { t: ">", c: PN }],
  [{ t: "  );", c: PN }],
  [{ t: "}", c: PN }],
  [],
  [{ t: "export", c: KW }, { t: " const ", c: KW }, { t: "metadata", c: VAR }, { t: " = {", c: PN }],
  [{ t: "  title", c: VAR }, { t: ": ", c: PN }, { t: '"Cursor — Agent Window"', c: ST }, { t: ",", c: PN }],
  [{ t: "  description", c: VAR }, { t: ": ", c: PN }, { t: '"Interactive front-end prototype"', c: ST }, { t: ",", c: PN }],
  [{ t: "};", c: PN }],
];

function ActivityIcon({
  icon: Icon,
  active,
  label,
}: {
  icon: typeof Files;
  active?: boolean;
  label: string;
}) {
  return (
    <div
      aria-label={label}
      className={cn(
        "relative flex h-10 w-12 items-center justify-center text-fg-3",
        active && "text-fg-1",
      )}
    >
      {active && <span className="absolute left-0 top-2 h-6 w-[2px] rounded-r bg-fg-1" />}
      <Icon size={20} strokeWidth={1.6} />
    </div>
  );
}

export function CursorShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-bg-0 text-fg-1 select-none">
      <header className="relative flex h-[38px] shrink-0 items-center border-b border-line-0 bg-bg-1 px-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="absolute left-1/2 top-1/2 flex h-[24px] w-[380px] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 rounded-md border border-line-0 bg-bg-2 text-[12px] text-fg-3">
          <Search size={12} />
          <span>cursor-lab</span>
        </div>
        <div className="ml-auto flex items-center gap-3 text-fg-3">
          <LayoutPanelLeft size={15} strokeWidth={1.6} />
          <LayoutPanelTop size={15} strokeWidth={1.6} />
          <PanelRight size={15} strokeWidth={1.6} className="text-fg-1" />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-12 shrink-0 flex-col items-center border-r border-line-0 bg-bg-1 py-1">
          <ActivityIcon icon={Files} label="Explorer" active />
          <ActivityIcon icon={Search} label="Search" />
          <ActivityIcon icon={GitBranch} label="Source control" />
          <ActivityIcon icon={Blocks} label="Extensions" />
          <div className="mt-auto flex flex-col items-center gap-1 pb-2">
            <div className="flex h-10 w-12 items-center justify-center text-fg-3">
              <Bell size={19} strokeWidth={1.6} />
            </div>
            <div className="flex h-10 w-12 items-center justify-center text-fg-3">
              <Settings size={19} strokeWidth={1.6} />
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-bg-0">
          <div className="flex h-[35px] shrink-0 items-stretch border-b border-line-0 bg-bg-1 text-[12.5px]">
            <div className="flex items-center gap-2 border-r border-line-0 bg-bg-0 px-3 text-fg-1">
              <span className="text-[10px] font-bold text-[#519aba]">TS</span>
              page.tsx
            </div>
            <div className="flex items-center gap-2 border-r border-line-0 px-3 text-fg-3">
              <span className="text-[10px] font-bold text-[#519aba]">TS</span>
              store.tsx
            </div>
            <div className="flex items-center gap-2 border-r border-line-0 px-3 text-fg-3">
              <span className="text-[10px] font-bold text-[#a074c4]">#</span>
              globals.css
            </div>
          </div>
          <div className="flex h-[26px] shrink-0 items-center gap-1.5 px-4 text-[11.5px] text-fg-3">
            <span>app</span>
            <span>›</span>
            <span>page.tsx</span>
            <span>›</span>
            <span className="text-fg-2">Home</span>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <pre className="h-full overflow-hidden px-2 pt-1 font-mono text-[12.5px] leading-[20px] text-fg-1">
              {CODE.map((line, i) => (
                <div key={i} className="flex">
                  <span className="w-10 shrink-0 pr-4 text-right text-fg-3/70">{i + 1}</span>
                  <span className="whitespace-pre">
                    {line.map((tok, j) => (
                      <span key={j} className={tok.c}>
                        {tok.t}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </pre>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-0" />
          </div>
        </section>

        {children}
      </div>

      <footer className="flex h-[22px] shrink-0 items-center gap-4 border-t border-line-0 bg-bg-1 px-3 text-[11px] text-fg-2">
        <span className="flex items-center gap-1">
          <GitBranch size={11} /> main
        </span>
        <span className="flex items-center gap-1">
          <CircleCheck size={11} /> 0 problems
        </span>
        <span className="ml-auto flex items-center gap-4">
          <span>Ln 9, Col 24</span>
          <span>UTF-8</span>
          <span>TypeScript JSX</span>
          <span className="flex items-center gap-1.5">
            <CursorMark size={12} /> Cursor Tab
          </span>
          <Share2 size={11} />
        </span>
      </footer>
    </div>
  );
}
