"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { comparison, plans } from "@/lib/landing-data";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Pricing() {
  const [annual, setAnnual] = useState(true);
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Pricing" title="Free for you, fair for your team" />
        <div className="mt-8 flex items-center justify-center gap-3 text-sm">
          <span className={cn(!annual && "font-medium")}>Monthly</span>
          <Switch checked={annual} onCheckedChange={setAnnual} aria-label="Annual billing" />
          <span className={cn(annual && "font-medium")}>Annual</span>
          <Badge variant="secondary">Save 20%</Badge>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p, i) => {
            const price = annual ? p.annual : p.monthly;
            return (
              <Reveal key={p.name} delay={i * 0.07}>
                <div className={cn("flex h-full flex-col rounded-2xl border bg-card p-6", p.featured && "border-primary shadow-xl shadow-primary/10")}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{p.name}</h3>
                    {p.featured ? <Badge>Popular</Badge> : null}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight">
                      {price === null ? "Custom" : `$${price}`}
                    </span>
                    {price !== null && price > 0 ? <span className="text-sm text-muted-foreground">/user/mo</span> : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{p.blurb}</p>
                  <ul className="mt-6 flex-1 space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2"><Check className="size-4 text-primary" />{f}</li>
                    ))}
                  </ul>
                  <a href="#get-started" className={cn(buttonVariants({ variant: p.featured ? "default" : "outline" }), "mt-6")}>
                    {p.cta}
                  </a>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mx-auto mt-16 max-w-3xl">
          <h3 className="mb-4 text-center text-lg font-semibold">How we compare</h3>
          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3 font-medium">Feature</th>
                  <th className="p-3 text-center font-medium">Slotly</th>
                  <th className="p-3 text-center font-medium">Others</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((c) => (
                  <tr key={c.feature} className="border-t">
                    <td className="p-3">{c.feature}</td>
                    {[c.us, c.them].map((v, i) => (
                      <td key={i} className="p-3 text-center">
                        {v ? <Check className="mx-auto size-4 text-primary" aria-label="Yes" /> : <X className="mx-auto size-4 text-muted-foreground" aria-label="No" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
