import { CalendarDays, Link2, Video } from "lucide-react";
import { steps } from "@/lib/landing-data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const days = [
  ["Mon", "8:30", "17:00"],
  ["Tue", "9:00", "18:30"],
  ["Wed", "10:00", "19:00"],
];

function StepVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="flex items-center justify-center gap-3">
        {["G", "O", "A"].map((c) => (
          <span key={c} className="grid size-12 place-items-center rounded-xl border bg-card font-semibold shadow-sm">
            {c}
          </span>
        ))}
        <Link2 className="size-5 text-primary" />
        <span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
          <CalendarDays className="size-5" />
        </span>
      </div>
    );
  }
  if (index === 1) {
    return (
      <ul className="space-y-2 text-sm">
        {days.map(([d, a, b]) => (
          <li key={d} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
            <span className="font-medium">{d}</span>
            <span className="text-muted-foreground">{a} am - {b}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="flex flex-wrap justify-center gap-2 text-sm">
      {["Video call", "Phone", "In person", "Walk"].map((m, i) => (
        <span key={m} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${i === 0 ? "border-primary bg-primary/10 text-primary" : "bg-card"}`}>
          {i === 0 ? <Video className="size-3.5" /> : null}
          {m}
        </span>
      ))}
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="How it works" title="Live in three steps" body="From sign up to your first booking in under five minutes." />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <div className="flex h-full flex-col rounded-2xl border bg-muted/30 p-6">
                <div className="grid h-40 place-items-center rounded-xl border border-dashed bg-background p-4">
                  <StepVisual index={i} />
                </div>
                <span className="mt-6 text-sm font-medium text-primary">0{i + 1}</span>
                <h3 className="mt-1 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-muted-foreground">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
