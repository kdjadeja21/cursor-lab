"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookingWidget } from "./booking-widget";
import { Reveal } from "./reveal";

export function Hero() {
  const [done, setDone] = useState(false);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setDone(true);
  };

  return (
    <section id="get-started" className="relative overflow-hidden">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
      <div aria-hidden className="absolute top-[-200px] left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28">
        <Reveal className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-6 gap-1.5 px-3 py-3.5">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Open source and free for individuals
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl md:text-7xl">
            Scheduling that <span className="text-gradient">gets out of the way</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted-foreground">
            Share one link. Let people book the moment you are free. No emails back and forth, no double bookings, no fuss.
          </p>
          <form onSubmit={onSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row">
            <Input type="email" required placeholder="you@company.com" aria-label="Email" className="h-10" disabled={done} />
            <Button type="submit" size="lg" className="h-10 gap-1" disabled={done}>
              {done ? <><Check className="size-4" /> Check your inbox</> : <>Get started <ArrowRight className="size-4" /></>}
            </Button>
          </form>
          <p className="mt-3 text-sm text-muted-foreground">No credit card required. Set up in two minutes.</p>
        </Reveal>
        <Reveal delay={0.15} className="mx-auto mt-14 max-w-3xl">
          <BookingWidget />
          <p className="mt-3 text-center text-sm text-muted-foreground">
            This is a live demo. Try booking a time.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
