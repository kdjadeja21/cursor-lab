"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { logos, stats } from "@/lib/landing-data";
import { Reveal } from "./reveal";

function Counter({ value, decimals = 0, suffix }: { value: number; decimals?: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, { duration: 1.6, ease: "easeOut", onUpdate: setN });
    return () => controls.stop();
  }, [inView, reduce, value]);

  const shown = value >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n.toFixed(decimals);
  return (
    <span ref={ref}>
      {shown}
      {suffix}
    </span>
  );
}

export function SocialProof() {
  return (
    <section className="border-y bg-muted/30 py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-sm text-muted-foreground">Trusted by fast-growing teams worldwide</p>
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-8">
          {logos.map((l) => (
            <span key={l} className="text-center text-lg font-semibold tracking-tight text-muted-foreground/70">
              {l}
            </span>
          ))}
        </div>
        <Reveal className="mt-14 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-semibold tracking-tight tabular-nums">
                <Counter value={s.value} decimals={s.decimals} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
