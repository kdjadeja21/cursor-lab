import { integrations } from "@/lib/landing-data";
import { SectionHeading } from "./section-heading";

export function Integrations() {
  const row = [...integrations, ...integrations];
  return (
    <section id="integrations" className="overflow-hidden py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Integrations" title="Plays well with your stack" body="Connect Slack, Salesforce and 100+ more. Bookings show up where your team already works." />
      </div>
      <div className="mt-12 [mask-image:linear-gradient(to_right,transparent,#000_15%,#000_85%,transparent)]">
        <ul className="flex w-max gap-3 motion-safe:animate-[marquee_40s_linear_infinite] hover:[animation-play-state:paused]">
          {row.map((name, i) => (
            <li
              key={`${name}-${i}`}
              aria-hidden={i >= integrations.length}
              className="rounded-full border bg-card px-5 py-2.5 text-sm font-medium"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
