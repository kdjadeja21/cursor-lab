import { CtaSection } from "./components/landing/cta-section";
import { Features } from "./components/landing/features";
import { Hero } from "./components/landing/hero";
import { HowItWorks } from "./components/landing/how-it-works";
import { SiteFooter } from "./components/landing/site-footer";
import { SiteHeader } from "./components/landing/site-header";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
