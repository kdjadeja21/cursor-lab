import { z } from "zod"

export const TIME_UNITS = ["years", "months"] as const
export const INTEREST_METHODS = ["simple", "compound"] as const
export const COMPOUNDING_FREQUENCIES = [
  "annually",
  "semiannually",
  "quarterly",
  "monthly",
  "daily",
] as const

export type TimeUnit = (typeof TIME_UNITS)[number]
export type InterestMethod = (typeof INTEREST_METHODS)[number]
export type CompoundingFrequency = (typeof COMPOUNDING_FREQUENCIES)[number]

export const MAX_PRINCIPAL = 1_000_000_000_000
export const MAX_RATE_PERCENT = 100
export const MAX_YEARS = 100

const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

// Above this, doubles can no longer represent whole cents exactly.
export const MAX_EXACT_AMOUNT = 1_000_000_000_000_000

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "scientific",
  maximumFractionDigits: 3,
})

const countFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

export interface InterestFormInput {
  principal: string
  annualRatePercent: string
  time: string
  timeUnit: TimeUnit | ""
  method: InterestMethod | ""
  frequency: CompoundingFrequency | ""
}

export const emptyInterestForm: InterestFormInput = {
  principal: "",
  annualRatePercent: "",
  time: "",
  timeUnit: "",
  method: "",
  frequency: "",
}

type CalculationBase = {
  principal: number
  annualRate: number
  annualRatePercent: number
  years: number
  time: number
  timeUnit: TimeUnit
}

export type InterestCalculation =
  | (CalculationBase & { method: "simple" })
  | (CalculationBase & {
      method: "compound"
      frequency: CompoundingFrequency
    })

export interface InterestYearRow {
  year: number
  partial: boolean
  startBalance: number
  interest: number
  endBalance: number
}

export interface InterestResult {
  interestEarned: number
  finalAmount: number
  detail: string
  /** True when any displayed amount is too large to show exactly to the cent. */
  tooLarge: boolean
  rows: InterestYearRow[]
}

export const interestFormSchema = z
  .object({
    principal: z.string(),
    annualRatePercent: z.string(),
    time: z.string(),
    timeUnit: z.union([z.enum(TIME_UNITS), z.literal("")]),
    method: z.union([z.enum(INTEREST_METHODS), z.literal("")]),
    frequency: z.union([z.enum(COMPOUNDING_FREQUENCIES), z.literal("")]),
  })
  .superRefine((value, ctx) => {
    const principal = readBoundedDecimal(value.principal, {
      empty: "Enter a principal.",
      min: 0,
      minExclusive: true,
      minMessage: "Enter a principal greater than 0.",
      max: MAX_PRINCIPAL,
      maxMessage: "Enter a principal of $1,000,000,000,000 or less.",
    })
    if (typeof principal !== "number") {
      addIssue(ctx, "principal", principal)
    }

    const rate = readBoundedDecimal(value.annualRatePercent, {
      empty: "Enter an annual rate.",
      min: 0,
      minExclusive: false,
      minMessage: "Enter an annual rate from 0 to 100.",
      max: MAX_RATE_PERCENT,
      maxMessage: "Enter an annual rate from 0 to 100.",
    })
    if (typeof rate !== "number") {
      addIssue(ctx, "annualRatePercent", rate)
    }

    const time = readBoundedDecimal(value.time, {
      empty: "Enter a time period.",
      min: 0,
      minExclusive: true,
      minMessage: "Enter a time period greater than 0.",
      max: Number.POSITIVE_INFINITY,
      maxMessage: "Enter a time period greater than 0.",
    })
    if (typeof time !== "number") {
      addIssue(ctx, "time", time)
    }

    if (value.timeUnit === "") {
      addIssue(ctx, "timeUnit", "Choose years or months.")
    } else if (typeof time === "number" && yearsFromUnit(time, value.timeUnit) > MAX_YEARS) {
      addIssue(ctx, "time", "Enter a time period of 100 years or less.")
    }

    if (value.method === "") {
      addIssue(ctx, "method", "Choose simple or compound interest.")
    }

    if (value.method === "compound" && value.frequency === "") {
      addIssue(ctx, "frequency", "Choose how often interest compounds.")
    }
  })

export function resultFromForm(value: InterestFormInput): InterestResult | null {
  const parsed = interestFormSchema.safeParse(value)
  if (!parsed.success) {
    return null
  }
  return calculateInterest(toCalculation(parsed.data))
}

export function calculateInterest(input: InterestCalculation): InterestResult {
  const finalAmount = balanceAt(input, input.years)
  const rows = buildRows(input)
  return {
    interestEarned: finalAmount - input.principal,
    finalAmount,
    detail: describeCalculation(input),
    tooLarge:
      !Number.isFinite(finalAmount) ||
      rows.some((row) => Math.abs(row.endBalance) >= MAX_EXACT_AMOUNT) ||
      Math.abs(finalAmount) >= MAX_EXACT_AMOUNT,
    rows,
  }
}

export function formatUsd(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "Too large"
  }
  if (Math.abs(amount) >= MAX_EXACT_AMOUNT) {
    return compactUsd.format(amount)
  }
  return usd.format(amount)
}

function addIssue(
  ctx: z.RefinementCtx,
  path: keyof InterestFormInput,
  message: string,
): void {
  ctx.addIssue({ code: "custom", path: [path], message })
}

function readBoundedDecimal(
  value: string,
  bounds: {
    empty: string
    min: number
    minExclusive: boolean
    minMessage: string
    max: number
    maxMessage: string
  },
): number | string {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return bounds.empty
  }
  if (!DECIMAL.test(trimmed)) {
    return "Enter a number using digits and an optional decimal point."
  }
  const amount = Number(trimmed)
  const belowMin = bounds.minExclusive ? amount <= bounds.min : amount < bounds.min
  if (belowMin) {
    return bounds.minMessage
  }
  if (amount > bounds.max) {
    return bounds.maxMessage
  }
  return amount
}

function yearsFromUnit(time: number, unit: TimeUnit): number {
  switch (unit) {
    case "years":
      return time
    case "months":
      return time / 12
    default: {
      const exhaustive: never = unit
      return exhaustive
    }
  }
}

function periodsPerYear(frequency: CompoundingFrequency): number {
  switch (frequency) {
    case "annually":
      return 1
    case "semiannually":
      return 2
    case "quarterly":
      return 4
    case "monthly":
      return 12
    case "daily":
      // Daily compounding uses a 365-day year.
      return 365
    default: {
      const exhaustive: never = frequency
      return exhaustive
    }
  }
}

function balanceAt(input: InterestCalculation, years: number): number {
  switch (input.method) {
    case "simple":
      return input.principal * (1 + input.annualRate * years)
    case "compound": {
      const periods = periodsPerYear(input.frequency)
      return input.principal * (1 + input.annualRate / periods) ** (periods * years)
    }
    default: {
      const exhaustive: never = input
      return exhaustive
    }
  }
}

function buildRows(input: InterestCalculation): InterestYearRow[] {
  const rows: InterestYearRow[] = []
  let cursor = 0
  let remaining = input.years
  while (remaining > 1e-9) {
    const span = Math.min(1, remaining)
    const start = cursor
    const end = cursor + span
    const startBalance = balanceAt(input, start)
    const endBalance = balanceAt(input, end)
    rows.push({
      year: rows.length + 1,
      partial: span < 1 - 1e-9,
      startBalance,
      interest: endBalance - startBalance,
      endBalance,
    })
    cursor = end
    remaining -= span
  }
  return rows
}

function describeCalculation(input: InterestCalculation): string {
  const rate = countFormat.format(input.annualRatePercent)
  const period = `${countFormat.format(input.time)} ${unitNoun(input.timeUnit, input.time)}`
  const amount = formatUsd(input.principal)
  switch (input.method) {
    case "simple":
      return `Simple interest on ${amount} at ${rate}% for ${period}.`
    case "compound":
      return `Compound interest on ${amount} at ${rate}% for ${period}, compounded ${frequencyAdverb(input.frequency)}.`
    default: {
      const exhaustive: never = input
      return exhaustive
    }
  }
}

function unitNoun(unit: TimeUnit, count: number): string {
  const singular = count === 1
  switch (unit) {
    case "years":
      return singular ? "year" : "years"
    case "months":
      return singular ? "month" : "months"
    default: {
      const exhaustive: never = unit
      return exhaustive
    }
  }
}

function frequencyAdverb(frequency: CompoundingFrequency): string {
  switch (frequency) {
    case "annually":
      return "annually"
    case "semiannually":
      return "semiannually"
    case "quarterly":
      return "quarterly"
    case "monthly":
      return "monthly"
    case "daily":
      return "daily"
    default: {
      const exhaustive: never = frequency
      return exhaustive
    }
  }
}

function toCalculation(value: InterestFormInput): InterestCalculation {
  const timeUnit = value.timeUnit
  const method = value.method
  if (timeUnit === "" || method === "") {
    throw new Error("Interest form was parsed before it was valid.")
  }
  const base: CalculationBase = {
    principal: Number(value.principal.trim()),
    annualRatePercent: Number(value.annualRatePercent.trim()),
    annualRate: Number(value.annualRatePercent.trim()) / 100,
    years: yearsFromUnit(Number(value.time.trim()), timeUnit),
    time: Number(value.time.trim()),
    timeUnit,
  }
  switch (method) {
    case "simple":
      return { ...base, method }
    case "compound": {
      const frequency = value.frequency
      if (frequency === "") {
        throw new Error("Compound interest requires a frequency.")
      }
      return { ...base, method, frequency }
    }
    default: {
      const exhaustive: never = method
      return exhaustive
    }
  }
}
