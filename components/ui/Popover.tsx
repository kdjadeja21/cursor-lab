"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  side?: "top" | "bottom";
  align?: "start" | "end";
  /** Element that owns the popover; clicks inside it do not close it. */
  anchorRef: RefObject<HTMLElement | null>;
  /** Element to refocus when the popover closes. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  label: string;
};

export function Popover({
  open,
  onClose,
  children,
  className,
  side = "top",
  align = "start",
  anchorRef,
  returnFocusRef,
  label,
}: Props) {
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) returnFocusRef?.current?.focus({ preventScroll: true });
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const onDown = (e: PointerEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose, anchorRef, returnFocusRef]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label={label}
          initial={{ opacity: 0, y: side === "top" ? 6 : -6, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.985 }}
          transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.7 }}
          className={cn(
            "absolute z-40 origin-bottom-left overflow-hidden rounded-xl border border-line-1 bg-bg-2/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85),0_0_0_1px_rgba(0,0,0,0.4)] backdrop-blur-xl",
            side === "top" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]",
            align === "start" ? "left-0" : "right-0 origin-bottom-right",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
