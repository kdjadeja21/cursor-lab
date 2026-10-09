import { z } from "zod"

export const INTEREST_MODES = ["simple", "compound"] as const
export const TIME_UNITS = ["years", "months", "days"] as const
export const COMPOUND_FREQUENCIES = [
  "annually",
  "semiannually",
  "quarterly",
  "monthly",
  "daily",
] as const

export type InterestMode = (typeof INTEREST_MODES)[number]
export type TimeUnit = (typeof TIME_UNITS)[number]
export type CompoundFrequency = (typeof COMPOUND_FREQUENCIES)[number]

export const PRINCIPAL_MESSAGE = "Enter a principal greater than 0."
export const RATE_MESSAGE = "Enter an annual rate of 0% or higher."
export const TIME_MESSAGE = "Enter a time period greater than 0."
export const TIME_MAX_MESSAGE = "Enter a time period of 100 years or less."
export const OVERFLOW_MESSAGE = "This combination is too large."
export const EMPTY_RESULTS_MESSAGE =
  "Enter a principal, rate, and time period to see results."

const MAX_YEARS = 100
const YEAR_EPSILON = 1e-9

const DECIMAL_PATTERN = /^[+]?(?:\d+\.?\d*|\.\d+)$/

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

export type ScheduleRow = {
  label: string
  interest: number
  cumulativeInterest: number
  balance: number
}

export type InterestResult = {
  interest: number
  finalAmount: number
  rows: ScheduleRow[]
}

export type InterestCalculation =
  | { status: "invalid" }
  | { status: "overflow" }
  | { status: "ready"; result: InterestResult }

type DecimalKind = "principal" | "rate" | "time"

export function formatUsd(amount: number): string {
  return usdFormatter.format(amount)
}

export function parseDecimal(raw: string, kind: DecimalKind): number | null {
  let cleaned = raw.trim()

  switch (kind) {
    case "principal":
      cleaned = cleaned.replace(/[$,]/g, "")
      break
    case "rate":
      cleaned = cleaned.replace(/[%,]/g, "")
      break
    case "time":
      cleaned = cleaned.replace(/,/g, "")
      break
    default: {
      const unreachable: never = kind
      return unreachable
    }
  }

  cleaned = cleaned.trim()
  if (!DECIMAL_PATTERN.test(cleaned)) {
    return null
  }

  const value = Number(cleaned)
  if (!Number.isFinite(value)) {
    return null
  }

  return value
}

export function toYears(time: number, unit: TimeUnit): number {
  switch (unit) {
    case "years":
      return time
    case "months":
      return time / 12
    case "days":
      return time / 365
    default: {
      const unreachable: never = unit
      return unreachable
    }
  }
}

export function periodsPerYear(frequency: CompoundFrequency): number {
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
      return 365
    default: {
      const unreachable: never = frequency
      return unreachable
    }
  }
}

function principalIssue(raw: string): string | undefined {
  const principal = parseDecimal(raw, "principal")
  if (principal === null || principal <= 0) {
    return PRINCIPAL_MESSAGE
  }
  return undefined
}

function rateIssue(raw: string): string | undefined {
  const rate = parseDecimal(raw, "rate")
  if (rate === null || rate < 0) {
    return RATE_MESSAGE
  }
  return undefined
}

function timeIssue(raw: string, unit: TimeUnit): string | undefined {
  const time = parseDecimal(raw, "time")
  if (time === null || time <= 0) {
    return TIME_MESSAGE
  }
  if (!(toYears(time, unit) <= MAX_YEARS)) {
    return TIME_MAX_MESSAGE
  }
  return undefined
}

export const interestFormSchema = z
  .object({
    principal: z.string(),
    rate: z.string(),
    time: z.string(),
    unit: z.enum(TIME_UNITS),
    mode: z.enum(INTEREST_MODES),
    frequency: z.enum(COMPOUND_FREQUENCIES),
  })
  .superRefine((value, ctx) => {
    const principal = principalIssue(value.principal)
    if (principal) {
      ctx.addIssue({ code: "custom", path: ["principal"], message: principal })
    }

    const rate = rateIssue(value.rate)
    if (rate) {
      ctx.addIssue({ code: "custom", path: ["rate"], message: rate })
    }

    const time = timeIssue(value.time, value.unit)
    if (time) {
      ctx.addIssue({ code: "custom", path: ["time"], message: time })
    }
  })

export type InterestFormValues = z.infer<typeof interestFormSchema>

export const interestFormDefaults: InterestFormValues = {
  principal: "",
  rate: "",
  time: "",
  unit: "years",
  mode: "simple",
  frequency: "annually",
}

export function interestFieldErrors(
  values: InterestFormValues,
): Partial<Record<"principal" | "rate" | "time", string>> {
  const parsed = interestFormSchema.safeParse(values)
  if (parsed.success) {
    return {}
  }

  const errors: Partial<Record<"principal" | "rate" | "time", string>> = {}
  for (const issue of parsed.error.issues) {
    const field = issue.path[0]
    if (
      (field === "principal" || field === "rate" || field === "time") &&
      errors[field] === undefined
    ) {
      errors[field] = issue.message
    }
  }
  return errors
}

function balanceAt(
  principal: number,
  annualRate: number,
  years: number,
  mode: InterestMode,
  frequency: CompoundFrequency,
): number {
  switch (mode) {
    case "simple":
      return principal * (1 + annualRate * years)
    case "compound": {
      const periods = periodsPerYear(frequency)
      return principal * (1 + annualRate / periods) ** (periods * years)
    }
    default: {
      const unreachable: never = mode
      return unreachable
    }
  }
}

function scheduleBoundaries(years: number): number[] {
  const fullYears = Math.floor(years + YEAR_EPSILON)
  const boundaries: number[] = []

  for (let year = 1; year <= fullYears; year += 1) {
    boundaries.push(year)
  }

  if (years - fullYears > YEAR_EPSILON) {
    boundaries.push(years)
  }

  return boundaries
}

function periodLabel(boundary: number): string {
  const nearestYear = Math.round(boundary)
  if (Math.abs(boundary - nearestYear) <= YEAR_EPSILON) {
    return `Year ${nearestYear}`
  }
  return "Partial year"
}

export function calculateInterest(values: InterestFormValues): InterestCalculation {
  const parsed = interestFormSchema.safeParse(values)
  if (!parsed.success) {
    return { status: "invalid" }
  }

  const principal = parseDecimal(parsed.data.principal, "principal")
  const ratePercent = parseDecimal(parsed.data.rate, "rate")
  const time = parseDecimal(parsed.data.time, "time")
  if (principal === null || ratePercent === null || time === null) {
    return { status: "invalid" }
  }

  const years = toYears(time, parsed.data.unit)
  const annualRate = ratePercent / 100
  const boundaries = scheduleBoundaries(years)
  const rows: ScheduleRow[] = []
  let previousBalance = principal

  for (const boundary of boundaries) {
    const balance = balanceAt(
      principal,
      annualRate,
      boundary,
      parsed.data.mode,
      parsed.data.frequency,
    )
    const cumulativeInterest = balance - principal
    const interest = balance - previousBalance
    if (
      !Number.isFinite(balance) ||
      !Number.isFinite(cumulativeInterest) ||
      !Number.isFinite(interest)
    ) {
      return { status: "overflow" }
    }

    rows.push({
      label: periodLabel(boundary),
      interest,
      cumulativeInterest,
      balance,
    })
    previousBalance = balance
  }

  const last = rows[rows.length - 1]
  if (!last) {
    return { status: "invalid" }
  }

  return {
    status: "ready",
    result: {
      interest: last.cumulativeInterest,
      finalAmount: last.balance,
      rows,
    },
  }
}
