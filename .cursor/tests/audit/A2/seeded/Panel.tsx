"use client";

import { forwardRef, useEffect, useState } from "react";

type PanelProps = {
  primary?: boolean;
  large?: boolean;
  compact?: boolean;
  rounded?: boolean;
};

export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(props, ref) {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/items").then((r) => r.json()).then(setItems);
  }, []);

  return (
    <div ref={ref} style={{ background: "#1a1a2e", color: "#ffffff" }}>
      <button className="px-4 py-2 rounded bg-blue-600 text-white">Refresh</button>
      {items.map((i) => (
        <p key={i}>{i}</p>
      ))}
    </div>
  );
});
