import type { Metadata } from "next"

import { InterestCalculator } from "@/components/interest-calculator/interest-calculator"

export const metadata: Metadata = {
  title: "Interest calculator",
  description:
    "Calculate simple or compound interest and a year-by-year breakdown from a principal, annual rate, and time period.",
}

export default function InterestCalculatorPage() {
  return (
    <main className="flex flex-1 flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:px-6 md:py-14">
        <header className="flex max-w-2xl flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Interest calculator</h1>
          <p className="text-muted-foreground">
            Compare simple and compound interest. Enter a principal, an annual rate, and a
            time period. Results stay empty until those inputs are valid.
          </p>
        </header>
        {/* Suspense skipped: this page has no async data, so there is no fallback to show. */}
        <InterestCalculator />
      </div>
    </main>
  )
}
