import type { Metadata } from "next"
import { Newsreader } from "next/font/google"

import { InterestCalculator } from "@/components/interest-calculator/interest-calculator"

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Interest calculator",
  description:
    "Calculate simple or compound interest and a year-by-year breakdown from a principal, annual rate, and time period.",
}

export default function InterestCalculatorPage() {
  return (
    <main
      className={`${newsreader.variable} interest-dashboard bg-radial-glow flex flex-1 flex-col text-foreground`}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 md:px-8 md:py-16">
        <header className="flex max-w-[68ch] flex-col gap-3">
          <h1 className="interest-display text-4xl font-medium tracking-tight text-balance md:text-5xl">
            Interest calculator
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            Compare simple and compound interest. Enter a principal, an annual rate, and a
            time period. Results appear after you choose Calculate. Editing the inputs doesn&apos;t
            update them until you press Calculate again.
          </p>
        </header>
        {/* Suspense skipped: this page has no async data, so there is no fallback to show. */}
        <InterestCalculator />
      </div>
    </main>
  )
}
