import { Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCases } from "@/lib/landing-data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function UseCases() {
  return (
    <section id="use-cases" className="bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Use cases" title="Built for how your team works" />
        <Reveal className="mt-12">
          <Tabs defaultValue={useCases[0].id} className="items-center gap-8">
            <TabsList className="h-auto flex-wrap">
              {useCases.map((u) => (
                <TabsTrigger key={u.id} value={u.id} className="px-4 py-1.5">{u.label}</TabsTrigger>
              ))}
            </TabsList>
            {useCases.map((u) => (
              <TabsContent key={u.id} value={u.id} className="w-full">
                <div className="grid items-center gap-8 rounded-2xl border bg-card p-8 md:grid-cols-2">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight">{u.title}</h3>
                    <p className="mt-3 text-muted-foreground">{u.body}</p>
                  </div>
                  <ul className="space-y-3">
                    {u.points.map((p) => (
                      <li key={p} className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3">
                        <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary"><Check className="size-3.5" /></span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Reveal>
      </div>
    </section>
  );
}
