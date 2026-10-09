"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import dynamic from "next/dynamic"
import { createContext, use, useId, useState, type ReactNode } from "react"
import { Controller, useForm, useWatch, type Control } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  emptyInterestForm,
  formatUsd,
  interestFormSchema,
  resultFromForm,
  type CompoundingFrequency,
  type InterestFormInput,
  type InterestMethod,
  type InterestResult,
  type TimeUnit,
} from "@/lib/interest"

const InterestGrowthChart = dynamic(
  () =>
    import("./interest-growth-chart").then((module) => module.InterestGrowthChart),
  {
    ssr: false,
    loading: () => <ChartLoading />,
  },
)

interface InterestCalculatorState {
  result: InterestResult | null
  stale: boolean
  method: InterestFormInput["method"]
  showAllErrors: boolean
}

interface InterestCalculatorActions {
  updateField: <Name extends keyof InterestFormInput>(
    name: Name,
    value: InterestFormInput[Name],
  ) => void
  submit: () => void
}

interface InterestCalculatorMeta {
  control: Control<InterestFormInput>
  fieldIds: Record<keyof InterestFormInput, string>
}

interface InterestCalculatorContextValue {
  state: InterestCalculatorState
  actions: InterestCalculatorActions
  meta: InterestCalculatorMeta
}

const InterestCalculatorContext =
  createContext<InterestCalculatorContextValue | null>(null)

const TIME_UNIT_OPTIONS = [
  { value: "years", label: "Years" },
  { value: "months", label: "Months" },
] as const satisfies readonly { value: TimeUnit; label: string }[]

const METHOD_OPTIONS = [
  { value: "simple", label: "Simple" },
  { value: "compound", label: "Compound" },
] as const satisfies readonly { value: InterestMethod; label: string }[]

const FREQUENCY_OPTIONS = [
  { value: "annually", label: "Annually" },
  { value: "semiannually", label: "Semiannually" },
  { value: "quarterly", label: "Quarterly" },
  { value: "monthly", label: "Monthly" },
  { value: "daily", label: "Daily" },
] as const satisfies readonly { value: CompoundingFrequency; label: string }[]

function assignChoice(
  name: "timeUnit" | "method" | "frequency",
  selected: string | undefined,
  updateField: InterestCalculatorActions["updateField"],
): void {
  switch (name) {
    case "timeUnit":
      switch (selected) {
        case "years":
        case "months":
          updateField(name, selected)
          return
        default:
          updateField(name, "")
          return
      }
    case "method":
      switch (selected) {
        case "simple":
        case "compound":
          updateField(name, selected)
          return
        default:
          updateField(name, "")
          return
      }
    case "frequency":
      switch (selected) {
        case "annually":
        case "semiannually":
        case "quarterly":
        case "monthly":
        case "daily":
          updateField(name, selected)
          return
        default:
          updateField(name, "")
          return
      }
    default: {
      const exhaustive: never = name
      return exhaustive
    }
  }
}

function useInterestCalculator(): InterestCalculatorContextValue {
  const value = use(InterestCalculatorContext)
  if (!value) {
    throw new Error("Interest calculator fields must be inside InterestCalculator.")
  }
  return value
}

export function InterestCalculator() {
  return (
    <InterestCalculatorProvider>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10">
        <InterestCalculatorForm />
        <InterestCalculatorResults />
      </div>
    </InterestCalculatorProvider>
  )
}

function InterestCalculatorProvider({ children }: { children: ReactNode }) {
  const form = useForm<InterestFormInput>({
    resolver: zodResolver(interestFormSchema),
    defaultValues: emptyInterestForm,
    mode: "onTouched",
    reValidateMode: "onChange",
  })
  // Results are computed only when Calculate is submitted, so typing never recalculates.
  const [result, setResult] = useState<InterestResult | null>(null)
  const [submittedKey, setSubmittedKey] = useState("")
  const values = useWatch({ control: form.control })
  const method: InterestFormInput["method"] = values.method ?? ""
  // Inputs that matter for the shown result; frequency only counts for compound interest.
  const inputKey = JSON.stringify([
    values.principal?.trim() ?? "",
    values.annualRatePercent?.trim() ?? "",
    values.time?.trim() ?? "",
    values.timeUnit ?? "",
    method,
    method === "compound" ? (values.frequency ?? "") : "",
  ])
  const baseId = useId()
  const fieldIds: InterestCalculatorMeta["fieldIds"] = {
    principal: `${baseId}-principal`,
    annualRatePercent: `${baseId}-annual-rate`,
    time: `${baseId}-time`,
    timeUnit: `${baseId}-time-unit`,
    method: `${baseId}-method`,
    frequency: `${baseId}-frequency`,
  }
  const value: InterestCalculatorContextValue = {
    state: {
      result,
      stale: result !== null && inputKey !== submittedKey,
      method,
      showAllErrors: form.formState.isSubmitted,
    },
    actions: {
      updateField: (name, fieldValue) => {
        const options = {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        } as const
        // setValue's path types do not narrow a generic field name, so each case is concrete.
        switch (name) {
          case "principal":
            form.setValue("principal", fieldValue as InterestFormInput["principal"], options)
            return
          case "annualRatePercent":
            form.setValue("annualRatePercent", fieldValue as InterestFormInput["annualRatePercent"], options)
            return
          case "time":
            form.setValue("time", fieldValue as InterestFormInput["time"], options)
            return
          case "timeUnit":
            form.setValue("timeUnit", fieldValue as InterestFormInput["timeUnit"], options)
            // The 100-year limit depends on the unit, so revalidate the time field too.
            if (form.getValues("time") !== "") {
              void form.trigger("time")
            }
            return
          case "method":
            form.setValue("method", fieldValue as InterestFormInput["method"], options)
            return
          case "frequency":
            form.setValue("frequency", fieldValue as InterestFormInput["frequency"], options)
            return
          default: {
            const exhaustive: never = name
            return exhaustive
          }
        }
      },
      // Server Actions skipped: calculating interest is not a mutation.
      submit: () => {
        void form.handleSubmit(
          (submitted) => {
            setResult(resultFromForm(submitted))
            setSubmittedKey(
              JSON.stringify([
                submitted.principal.trim(),
                submitted.annualRatePercent.trim(),
                submitted.time.trim(),
                submitted.timeUnit,
                submitted.method,
                submitted.method === "compound" ? submitted.frequency : "",
              ]),
            )
          },
          () => {
            setResult(null)
          },
        )()
      },
    },
    meta: {
      control: form.control,
      fieldIds,
    },
  }

  return (
    <InterestCalculatorContext value={value}>{children}</InterestCalculatorContext>
  )
}

function InterestCalculatorForm() {
  const { actions } = useInterestCalculator()
  const titleId = useId()

  return (
    <Card className="shadow-sm lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle>
          <h2 id={titleId} className="text-lg font-medium">
            Interest inputs
          </h2>
        </CardTitle>
        <CardDescription>
          Principal, rate, and time. These values are used when you choose Calculate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          aria-labelledby={titleId}
          className="flex flex-col gap-6"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            actions.submit()
          }}
        >
          <FieldGroup>
            <NumberField
              name="principal"
              label="Principal (USD)"
              description="Amount you start with, in US dollars."
            />
            <NumberField
              name="annualRatePercent"
              label="Annual rate (%)"
              description="Nominal annual rate. Enter 5 for 5%."
            />
            <NumberField
              name="time"
              label="Time period"
              description="How long the money earns interest."
            />
            <ChoiceField
              name="timeUnit"
              label="Time unit"
              description="Months are converted to years for the calculation."
              options={TIME_UNIT_OPTIONS}
            />
            <ChoiceField
              name="method"
              label="Interest type"
              description="Compound interest uses the frequency below."
              options={METHOD_OPTIONS}
            />
            <FrequencyField />
          </FieldGroup>
          <Button type="submit" size="lg" className="w-full">
            Calculate
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function FrequencyField() {
  const { state } = useInterestCalculator()
  switch (state.method) {
    case "compound":
      return (
        <ChoiceField
          name="frequency"
          label="Compounding frequency"
          description="How often interest is added to the balance."
          options={FREQUENCY_OPTIONS}
        />
      )
    case "simple":
    case "":
      return null
    default: {
      const exhaustive: never = state.method
      return exhaustive
    }
  }
}

function NumberField({
  name,
  label,
  description,
}: {
  name: "principal" | "annualRatePercent" | "time"
  label: string
  description: string
}) {
  const { actions, meta, state } = useInterestCalculator()
  const errorId = `${meta.fieldIds[name]}-error`
  const descriptionId = `${meta.fieldIds[name]}-description`

  return (
    <Controller
      name={name}
      control={meta.control}
      render={({ field, fieldState }) => {
        const showError = Boolean(fieldState.error) && (fieldState.isTouched || state.showAllErrors)
        const describedBy = showError ? `${descriptionId} ${errorId}` : descriptionId
        return (
          <Field data-invalid={showError ? true : undefined}>
            <FieldLabel htmlFor={meta.fieldIds[name]}>{label}</FieldLabel>
            <Input
              id={meta.fieldIds[name]}
              name={field.name}
              ref={field.ref}
              value={field.value}
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              aria-required="true"
              aria-invalid={showError ? true : undefined}
              aria-describedby={describedBy}
              onBlur={field.onBlur}
              onChange={(event) => {
                actions.updateField(name, event.currentTarget.value)
              }}
            />
            <FieldDescription id={descriptionId}>{description}</FieldDescription>
            <FieldError id={errorId} errors={showError ? [fieldState.error] : undefined} />
          </Field>
        )
      }}
    />
  )
}

function ChoiceField({
  name,
  label,
  description,
  options,
}: {
  name: "timeUnit" | "method" | "frequency"
  label: string
  description: string
  options: readonly { value: string; label: string }[]
}) {
  const { actions, meta, state } = useInterestCalculator()
  const errorId = `${meta.fieldIds[name]}-error`
  const descriptionId = `${meta.fieldIds[name]}-description`

  return (
    <Controller
      name={name}
      control={meta.control}
      render={({ field, fieldState }) => {
        const showError = Boolean(fieldState.error) && (fieldState.isTouched || state.showAllErrors)
        const describedBy = showError ? `${descriptionId} ${errorId}` : descriptionId
        return (
          <Field data-invalid={showError ? true : undefined}>
            <FieldTitle id={meta.fieldIds[name]}>{label}</FieldTitle>
            <ToggleGroup
              aria-labelledby={meta.fieldIds[name]}
              aria-describedby={describedBy}
              variant="outline"
              size="lg"
              spacing={2}
              className="max-w-full flex-wrap"
              value={field.value ? [field.value] : []}
              onBlur={field.onBlur}
              onValueChange={(next) => {
                // Single-select: ignore empty changes so clicking the selected item keeps it selected.
                if (next.length === 0) {
                  return
                }
                assignChoice(name, next[0], actions.updateField)
              }}
            >
              {options.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldDescription id={descriptionId}>{description}</FieldDescription>
            <FieldError id={errorId} errors={showError ? [fieldState.error] : undefined} />
          </Field>
        )
      }}
    />
  )
}

function InterestCalculatorResults() {
  const { state } = useInterestCalculator()
  const scheduleHeadingId = useId()
  const result = state.result
  if (!result) {
    return (
      <Empty className="min-h-72 border border-border bg-card">
        <EmptyHeader>
          <EmptyTitle>No results yet</EmptyTitle>
          <EmptyDescription>
            Fill in the form and choose Calculate to see interest.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {state.stale ? (
        <p className="rounded-lg border border-border bg-muted px-4 py-3 text-sm font-medium text-foreground">
          Inputs changed, press Calculate to update. The results below are out of date.
        </p>
      ) : null}
      <div
        data-stale={state.stale ? true : undefined}
        className="flex min-w-0 flex-col gap-6 transition-opacity data-[stale]:opacity-50"
      >
        <InterestCalculatorSummary />
        {canChart(result) ? (
          <InterestGrowthChart result={result} describedBy={scheduleHeadingId} />
        ) : null}
        <InterestCalculatorSchedule headingId={scheduleHeadingId} />
      </div>
    </div>
  )
}

function InterestCalculatorSummary() {
  const { state } = useInterestCalculator()
  const headingId = useId()
  const result = state.result
  if (!result) {
    return null
  }
  const principal = principalOf(result)

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-4">
      <h2 id={headingId} className="text-lg font-medium">
        Results
      </h2>
      {/* One short announcement, only when Calculate produces a result. */}
      <p role="status" className="sr-only">
        {`Interest earned ${formatUsd(result.interestEarned)}, final amount ${formatUsd(result.finalAmount)}.`}
      </p>
      <p className="text-sm text-muted-foreground">{result.detail}</p>
      {result.tooLarge ? (
        <p role="note" className="text-sm font-medium text-destructive">
          Result too large to display accurately. Amounts are shown in
          scientific notation and are approximate.
        </p>
      ) : null}
      <div className="grid gap-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardDescription>Total amount</CardDescription>
            <CardTitle className="interest-display text-4xl font-medium tracking-tight tabular-nums md:text-5xl">
              {formatUsd(result.finalAmount)}
            </CardTitle>
          </CardHeader>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="shadow-sm" size="sm">
            <CardHeader>
              <CardDescription>Interest earned</CardDescription>
              <CardTitle className="text-2xl font-medium tabular-nums">
                {formatUsd(result.interestEarned)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm" size="sm">
            <CardHeader>
              <CardDescription>Principal</CardDescription>
              <CardTitle className="text-2xl font-medium tabular-nums">
                {formatUsd(principal)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  )
}

function InterestCalculatorSchedule({ headingId }: { headingId: string }) {
  const { state } = useInterestCalculator()
  const result = state.result
  if (!result) {
    return null
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>
          <h2 id={headingId} className="text-lg font-medium">
            Year-by-year breakdown
          </h2>
        </CardTitle>
        <CardDescription>
          Principal and interest earned so far match the chart. Interest this
          period is the interest for that single year.
        </CardDescription>
      </CardHeader>
      <CardContent className="-mx-(--card-spacing)">
        <Table
          containerProps={{
            tabIndex: 0,
            role: "region",
            "aria-label": "Year-by-year breakdown table, scrollable",
          }}
        >
          <TableCaption className="sr-only">Year-by-year breakdown</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Year</TableHead>
              <TableHead scope="col" className="text-right">
                Principal
              </TableHead>
              <TableHead scope="col" className="text-right">
                Interest earned so far
              </TableHead>
              <TableHead scope="col" className="text-right">
                Interest this period
              </TableHead>
              <TableHead scope="col" className="text-right">
                Ending balance
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.map((row) => (
              <TableRow key={row.year}>
                <TableCell>
                  {row.partial ? `${row.year} (partial)` : row.year}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUsd(principalOf(result))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUsd(row.cumulativeInterest)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUsd(row.interest)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUsd(row.endBalance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function ChartLoading() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading growth chart</span>
      <Skeleton className="h-72 w-full" />
    </div>
  )
}

function canChart(result: InterestResult): boolean {
  if (!Number.isFinite(result.finalAmount) || !Number.isFinite(result.interestEarned)) {
    return false
  }
  if (result.rows.length === 0) {
    return false
  }
  return result.rows.every(
    (row) =>
      Number.isFinite(row.startBalance) &&
      Number.isFinite(row.endBalance) &&
      Number.isFinite(row.interest),
  )
}

function principalOf(result: InterestResult): number {
  const start = result.rows[0]?.startBalance
  if (typeof start === "number" && Number.isFinite(start)) {
    return start
  }
  return result.finalAmount - result.interestEarned
}
