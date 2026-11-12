import { BellRing, CreditCard, Code2, Globe2, Languages, Link2, ShieldCheck, Timer, Video } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const notifications = [
  ["Meeting starts in 15 mins", "Your next meeting is about to begin", "15m"],
  ["Booking rescheduled", "Melissa moved to Wed, 15:00", "30m"],
  ["New booking confirmed", "James booked a discovery call", "now"],
];

const small = [
  { icon: CreditCard, title: "Accept payments", body: "Charge for bookings with Stripe." },
  { icon: Video, title: "Built-in video", body: "Slotly Video, no extra tools." },
  { icon: ShieldCheck, title: "Privacy first", body: "Encrypted and under your control." },
  { icon: Languages, title: "65+ languages", body: "Meet anyone, anywhere." },
  { icon: Code2, title: "Easy embeds", body: "Drop booking into any page." },
  { icon: Globe2, title: "Timezone smart", body: "Always shown in local time." },
];

export function Features() {
  return (
    <section id="features" className="bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Features" title="Everything you need, nothing you do not" body="Unlimited and free for individuals." />
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-3">
            <div className="h-full rounded-2xl border bg-card p-6">
              <Timer className="size-5 text-primary" />
              <h3 className="mt-3 text-lg font-semibold">Avoid meeting overload</h3>
              <p className="mt-1 text-muted-foreground">Daily, weekly and monthly limits, with buffers around every event.</p>
              <dl className="mt-5 space-y-2 text-sm">
                {[["Minimum notice", "24 hours"], ["Buffer before", "30 mins"], ["Buffer after", "30 mins"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between rounded-lg border bg-background px-3 py-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="md:col-span-3">
            <div className="h-full rounded-2xl border bg-card p-6">
              <Link2 className="size-5 text-primary" />
              <h3 className="mt-3 text-lg font-semibold">A booking link people remember</h3>
              <p className="mt-1 text-muted-foreground">Short, branded and easy to share anywhere.</p>
              <div className="mt-5 rounded-lg border bg-background px-3 py-2 font-mono text-sm">slotly.app/<span className="text-primary">alex</span></div>
              <div className="mt-3 flex gap-2 text-sm">
                {["15m", "30m", "45m", "1h"].map((d, i) => (
                  <span key={d} className={`rounded-md border px-2.5 py-1 ${i === 1 ? "border-primary bg-primary/10 text-primary" : ""}`}>{d}</span>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal className="md:col-span-6">
            <div className="grid gap-6 rounded-2xl border bg-card p-6 md:grid-cols-2 md:items-center">
              <div>
                <BellRing className="size-5 text-primary" />
                <h3 className="mt-3 text-lg font-semibold">Fewer no-shows with automated reminders</h3>
                <p className="mt-1 text-muted-foreground">Send SMS or email reminders and follow-ups that collect context before the call.</p>
              </div>
              <ul className="space-y-2">
                {notifications.map(([t, b, w]) => (
                  <li key={t} className="flex items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{t}</p>
                      <p className="text-sm text-muted-foreground">{b}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          {small.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08} className="md:col-span-2">
              <div className="h-full rounded-2xl border bg-card p-5 transition-colors hover:border-primary/50">
                <f.icon className="size-5 text-primary" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
