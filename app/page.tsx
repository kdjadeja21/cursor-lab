import { AgentWindow } from "@/components/agent/AgentWindow";
import { CursorShell } from "@/components/shell/CursorShell";
import { AgentProvider } from "@/lib/store";

export default function Home() {
  return (
    <AgentProvider>
      <CursorShell>
        <AgentWindow />
      </CursorShell>
    </AgentProvider>
  );
}
