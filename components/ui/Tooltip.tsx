"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Kbd } from "@/components/ui/Kbd";

type Props = {
  label: ReactNode;
  keys?: string[];
  side?: "top" | "bottom";
  align?: "center" | "start" | "end";
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

export function Tooltip({
  label,
  keys,
  side = "top",
  align = "center",
  children,
  className,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const show = open && !disabled;

  return (
    <span
      className={cn("relative inline-flex", className)}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-describedby={show ? id : undefined}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === "top" ? 2 : -2, scale: 0.98 }}
            transition={{ duration: 0.14, ease: "easeOut", delay: 0.25 }}
            className={cn(
              "pointer-events-none absolute z-50 flex items-center gap-2 whitespace-nowrap rounded-md border border-line-1 bg-bg-4 px-2 py-1 text-[11.5px] font-medium text-fg-1 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.7)]",
              side === "top" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]",
              align === "center" && "left-1/2 -translate-x-1/2",
              align === "start" && "left-0",
              align === "end" && "right-0",
            )}
          >
            {label}
            {keys && <Kbd keys={keys} />}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
