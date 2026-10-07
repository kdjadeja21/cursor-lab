import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { testimonials } from "@/lib/landing-data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Testimonials() {
  return (
    <section className="bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Wall of love" title="Do not just take our word for it" body="Real words from people who scheduled less and did more." />
        <div className="mt-14 columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={(i % 3) * 0.08} className="break-inside-avoid">
              <figure className="rounded-2xl border bg-card p-6">
                <blockquote className="text-pretty">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{t.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-muted-foreground">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
