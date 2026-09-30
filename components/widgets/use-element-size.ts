"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Observes an element's box so charts can be given explicit pixel dimensions.
 * Recharts' own responsive container collapses to zero height inside the flex
 * layouts used by widget frames, so the measurement is done here instead.
 */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((current) => {
        const next = { width: Math.round(width), height: Math.round(height) };
        return current.width === next.width && current.height === next.height
          ? current
          : next;
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}
