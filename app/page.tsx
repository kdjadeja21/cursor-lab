import { ClosingCta } from "@/components/landing/closing-cta"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { ProblemStrip } from "@/components/landing/problem-strip"
import { ProductProof } from "@/components/landing/product-proof"
import { SiteFrame } from "@/components/landing/site-frame"
import { Separator } from "@/components/ui/separator"

export default function Home() {
  return (
    <SiteFrame>
      <Hero />
      <ProblemStrip />
      <HowItWorks />
      <Separator />
      <ProductProof />
      <Separator />
      <ClosingCta />
    </SiteFrame>
  )
}
