"use client";

import { CursorMark } from "@/components/brand/CursorMark";
import type { TextBlock } from "@/lib/types";

export function StreamingText({ block, speed }: { block: TextBlock; speed: number }) {
  const paragraphs = block.text.split("\n\n");
  return (
    <div className="text-[13.5px] leading-[1.6] text-fg-1">
      {paragraphs.map((p, i) => (
        <p key={i} className={i > 0 ? "mt-2.5" : undefined}>
          {p}
          {!block.done && i === paragraphs.length - 1 && (
            <span className="ml-1 inline-flex translate-y-[2px] [animation:caret-blink_1s_steps(1)_infinite]">
              <CursorMark size={12} state="working" speed={speed} />
            </span>
          )}
        </p>
      ))}
    </div>
  );
}
