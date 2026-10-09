"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { createContext, use, useId, useState, type ReactNode } from "react"
import { Controller, useForm, useWatch, type Control } from "react-hook-form"

import { Button } from "@/components/ui/button"
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

interface InterestCalculatorState {
  result: InterestResult | null
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
      <div className="grid gap-8 md:grid-cols-2 md:items-start">
        <InterestCalculatorForm />
        <div className="flex flex-col gap-6">
          <InterestCalculatorSummary />
          <InterestCalculatorSchedule />
        </div>
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
  const values = useWatch({ control: form.control })
  const method: InterestFormInput["method"] = values.method ?? ""
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
      submit: () => {
        void form.handleSubmit(
          (submitted) => {
            setResult(resultFromForm(submitted))
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

  return (
    <form
      aria-label="Interest inputs"
      className="flex flex-col gap-5"
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
      <Button type="submit" className="w-full md:w-fit">
        Calculate
      </Button>
    </form>
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

function InterestCalculatorSummary() {
  const { state } = useInterestCalculator()
  const headingId = useId()
  const result = state.result
  if (!result) {
    return (
      <Empty className="border border-border bg-card">
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
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground"
    >
      {/* Card skipped: components/ui/card.tsx is added by PRs #9 and #10. */}
      <h2 id={headingId} className="text-lg font-semibold">
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
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">Interest earned</dt>
          <dd className="text-2xl font-semibold tabular-nums">
            {formatUsd(result.interestEarned)}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">Final amount</dt>
          <dd className="text-2xl font-semibold tabular-nums">
            {formatUsd(result.finalAmount)}
          </dd>
        </div>
      </dl>
    </section>
  )
}

function InterestCalculatorSchedule() {
  const { state } = useInterestCalculator()
  const headingId = useId()
  const result = state.result
  if (!result) {
    return null
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="text-lg font-semibold">
        Year-by-year breakdown
      </h2>
      <Table>
        <TableCaption className="sr-only">Year-by-year breakdown</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Year</TableHead>
            <TableHead scope="col" className="text-right">
              Starting balance
            </TableHead>
            <TableHead scope="col" className="text-right">
              Interest
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
                {formatUsd(row.startBalance)}
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
    </section>
  )
}
