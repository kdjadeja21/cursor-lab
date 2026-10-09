import type { Metadata } from "next"

import { InterestCalculator } from "@/components/interest-calculator"

export const metadata: Metadata = {
  title: "Interest calculator",
  description:
    "Calculate simple or compound interest and review a year-by-year breakdown.",
}

export default function InterestCalculatorPage() {
  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-12">
        <header className="flex max-w-2xl flex-col gap-2">
          <h1 className="font-heading text-2xl font-medium tracking-tight sm:text-3xl">
            Interest calculator
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Compare simple and compound interest. Results appear once the
            principal, annual rate, and time period are valid.
          </p>
        </header>
        <InterestCalculator />
      </main>
    </div>
  )
}
