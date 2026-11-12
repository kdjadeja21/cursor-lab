"use client";

import { FileCode2 } from "lucide-react";
import { motion } from "motion/react";
import type { UserMessage as UserMessageType } from "@/lib/types";

export function UserMessage({ message }: { message: UserMessageType }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 36 }}
      className="rounded-xl border border-line-1 bg-bg-2 px-3.5 py-2.5"
    >
      {message.context.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {message.context.map((c) => (
            <span
              key={c}
              className="flex h-[18px] items-center gap-1 rounded border border-line-0 bg-bg-3 px-1.5 text-[10.5px] text-fg-2"
            >
              <FileCode2 size={9} />
              {c}
            </span>
          ))}
        </div>
      )}
      <p className="whitespace-pre-wrap text-[13.5px] leading-[1.55] text-fg-0">{message.text}</p>
    </motion.div>
  );
}
