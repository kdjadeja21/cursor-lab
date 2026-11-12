"use client";

import { Fragment } from "react";
import { cn } from "@/lib/cn";

/** Splits on backticks so inline code reads as code while it streams in. */
export function StreamText({
  text,
  streaming,
  className,
}: {
  text: string;
  streaming: boolean;
  className?: string;
}) {
  const parts = text.split("`");

  return (
    <p className={cn("text-[13px] leading-[1.68] text-fg", className)}>
      {parts.map((part, index) => {
        if (part.length === 0) return null;
        return index % 2 === 1 ? (
          <code
            key={index}
            className="rounded-[5px] border border-line bg-ink-800/80 px-[5px] py-[1.5px] font-mono text-[11.5px] text-fg-muted"
          >
            {part}
          </code>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        );
      })}
      {streaming ? (
        <span
          aria-hidden
          className="ml-[2px] inline-block h-[13px] w-[2px] translate-y-[2px] animate-caret rounded-full bg-fg-muted align-middle"
        />
      ) : null}
    </p>
  );
}
