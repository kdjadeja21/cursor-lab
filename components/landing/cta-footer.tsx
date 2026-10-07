import { buttonVariants } from "@/components/ui/button";
import { footerColumns } from "@/lib/landing-data";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { Logo } from "./navbar";

export function Cta() {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground">
        <div aria-hidden className="absolute -top-24 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-white/20 blur-3xl" />
        <h2 className="relative text-3xl font-semibold tracking-tight text-balance sm:text-5xl">Smarter, simpler scheduling</h2>
        <p className="relative mx-auto mt-4 max-w-lg text-primary-foreground/80">Join millions who stopped playing calendar tag.</p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="#get-started" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "h-10")}>Get started free</a>
          <a href="#pricing" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "h-10 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground")}>Talk to sales</a>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t py-14">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">Our mission is to connect a billion people through scheduling that respects their time.</p>
        </div>
        {footerColumns.map((c) => (
          <div key={c.title}>
            <h3 className="text-sm font-semibold">{c.title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {c.links.map((l) => (
                <li key={l}><a href="#" className="hover:text-foreground">{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-12 max-w-6xl px-4 text-sm text-muted-foreground sm:px-6">&copy; {new Date().getFullYear()} Slotly. Demo project, all names fictional.</p>
    </footer>
  );
}
