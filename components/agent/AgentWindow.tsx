"use client";

import { AgentHeader } from "@/components/agent/AgentHeader";
import { Composer } from "@/components/agent/composer/Composer";
import { Transcript } from "@/components/agent/Transcript";
import { useGlobalShortcuts } from "@/lib/shortcuts";
import { useAgentState } from "@/lib/store";

export function AgentWindow() {
  useGlobalShortcuts();
  const { settings } = useAgentState();

  return (
    <aside
      data-mode={settings.mode}
      aria-label="Agent"
      className="flex w-[520px] shrink-0 flex-col border-l border-line-0 bg-bg-1 text-fg-1 select-text"
    >
      <AgentHeader />
      <div className="min-h-0 flex-1">
        <Transcript />
      </div>
      <Composer />
    </aside>
  );
}
