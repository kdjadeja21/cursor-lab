"use client";

import { CalendarCheck, Menu } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navLinks } from "@/lib/landing-data";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

export function Logo() {
  return (
    <a href="#" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <CalendarCheck className="size-4" />
      </span>
      Slotly
    </a>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a href="#" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")}>
            Sign in
          </a>
          <a href="#get-started" className={cn(buttonVariants(), "hidden sm:inline-flex")}>
            Get started free
          </a>
          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" size="icon" aria-label="Open menu" className="md:hidden" />}
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="px-4 pt-4">Menu</SheetTitle>
              <nav className="flex flex-col gap-1 p-4">
                {navLinks.map((l) => (
                  <a key={l.href} href={l.href} className="rounded-md px-3 py-3 text-base hover:bg-muted">
                    {l.label}
                  </a>
                ))}
                <a href="#get-started" className={cn(buttonVariants(), "mt-4")}>
                  Get started free
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
