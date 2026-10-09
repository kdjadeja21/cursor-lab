"use client"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

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
import { Separator } from "@/components/ui/separator"
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
  COMPOUND_FREQUENCIES,
  EMPTY_RESULTS_MESSAGE,
  INTEREST_MODES,
  OVERFLOW_MESSAGE,
  TIME_UNITS,
  calculateInterest,
  formatUsd,
  interestFieldErrors,
  interestFormDefaults,
  interestFormSchema,
  type CompoundFrequency,
  type InterestFormValues,
  type InterestMode,
  type ScheduleRow,
  type TimeUnit,
} from "@/lib/interest"

const fieldOptions = {
  shouldDirty: true,
  shouldTouch: true,
  shouldValidate: true,
} as const

function describedBy(descriptionId: string, errorId: string, invalid: boolean) {
  return invalid ? `${descriptionId} ${errorId}` : descriptionId
}

export function InterestCalculator() {
  // FormProvider/useForm already shares form state.
  const form = useForm<InterestFormValues>({
    defaultValues: interestFormDefaults,
    mode: "all",
    resolver: zodResolver(interestFormSchema),
  })

  const watched = useWatch({
    control: form.control,
    defaultValue: interestFormDefaults,
  })
  const values: InterestFormValues = {
    principal: watched.principal ?? interestFormDefaults.principal,
    rate: watched.rate ?? interestFormDefaults.rate,
    time: watched.time ?? interestFormDefaults.time,
    unit: watched.unit ?? interestFormDefaults.unit,
    mode: watched.mode ?? interestFormDefaults.mode,
    frequency: watched.frequency ?? interestFormDefaults.frequency,
  }

  // Results are derived during render from values that pass Zod.
  const fieldErrors = interestFieldErrors(values)
  const calculation = calculateInterest(values)
  const { touchedFields, dirtyFields } = form.formState

  const principalInvalid = Boolean(
    (touchedFields.principal || dirtyFields.principal) && fieldErrors.principal,
  )
  const rateInvalid = Boolean(
    (touchedFields.rate || dirtyFields.rate) && fieldErrors.rate,
  )
  const timeInvalid = Boolean(
    (touchedFields.time || dirtyFields.time) && fieldErrors.time,
  )

  function selectMode(groupValue: string[]) {
    const next = groupValue[0]
    if (!isInterestMode(next)) {
      return
    }
    form.setValue("mode", next, fieldOptions)
  }

  function selectUnit(groupValue: string[]) {
    const next = groupValue[0]
    if (!isTimeUnit(next)) {
      return
    }
    form.setValue("unit", next, fieldOptions)
  }

  function selectFrequency(groupValue: string[]) {
    const next = groupValue[0]
    if (!isCompoundFrequency(next)) {
      return
    }
    form.setValue("frequency", next, fieldOptions)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="w-full min-w-0">
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>
              Amounts are in US dollars. The rate is a nominal annual percent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault()
              }}
            >
              <FieldGroup>
                <Field data-invalid={principalInvalid ? true : undefined}>
                  <FieldLabel htmlFor="principal">Principal</FieldLabel>
                  <Input
                    id="principal"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-invalid={principalInvalid ? true : undefined}
                    aria-describedby={describedBy(
                      "principal-description",
                      "principal-error",
                      principalInvalid,
                    )}
                    {...form.register("principal")}
                  />
                  <FieldDescription id="principal-description">
                    US dollars.
                  </FieldDescription>
                  {principalInvalid ? (
                    <FieldError id="principal-error">
                      {fieldErrors.principal}
                    </FieldError>
                  ) : null}
                </Field>

                <Field data-invalid={rateInvalid ? true : undefined}>
                  <FieldLabel htmlFor="rate">Annual rate</FieldLabel>
                  <Input
                    id="rate"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-invalid={rateInvalid ? true : undefined}
                    aria-describedby={describedBy(
                      "rate-description",
                      "rate-error",
                      rateInvalid,
                    )}
                    {...form.register("rate")}
                  />
                  <FieldDescription id="rate-description">
                    Nominal annual percent.
                  </FieldDescription>
                  {rateInvalid ? (
                    <FieldError id="rate-error">{fieldErrors.rate}</FieldError>
                  ) : null}
                </Field>

                <Field data-invalid={timeInvalid ? true : undefined}>
                  <FieldLabel htmlFor="time">Time period</FieldLabel>
                  <Input
                    id="time"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-invalid={timeInvalid ? true : undefined}
                    aria-describedby={describedBy(
                      "time-description",
                      "time-error",
                      timeInvalid,
                    )}
                    {...form.register("time")}
                  />
                  <FieldDescription id="time-description">
                    Greater than 0 and at most 100 years.
                  </FieldDescription>
                  {timeInvalid ? (
                    <FieldError id="time-error">{fieldErrors.time}</FieldError>
                  ) : null}
                </Field>

                <Field>
                  <FieldTitle id="unit-label">Units</FieldTitle>
                  <ToggleGroup
                    variant="outline"
                    size="sm"
                    className="w-full flex-wrap"
                    aria-labelledby="unit-label"
                    value={[values.unit]}
                    onValueChange={selectUnit}
                  >
                    <ToggleGroupItem value="years">Years</ToggleGroupItem>
                    <ToggleGroupItem value="months">Months</ToggleGroupItem>
                    <ToggleGroupItem value="days">Days</ToggleGroupItem>
                  </ToggleGroup>
                </Field>

                <Field>
                  <FieldTitle id="mode-label">Interest type</FieldTitle>
                  <ToggleGroup
                    variant="outline"
                    size="sm"
                    className="w-full flex-wrap"
                    aria-labelledby="mode-label"
                    value={[values.mode]}
                    onValueChange={selectMode}
                  >
                    <ToggleGroupItem value="simple">Simple</ToggleGroupItem>
                    <ToggleGroupItem value="compound">Compound</ToggleGroupItem>
                  </ToggleGroup>
                </Field>

                <FrequencyField
                  mode={values.mode}
                  frequency={values.frequency}
                  onFrequencyChange={selectFrequency}
                />
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0">
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Interest earned and the final amount.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div aria-live="polite">
              <Results calculation={calculation} />
            </div>
          </CardContent>
        </Card>
      </div>

      {calculation.status === "ready" ? (
        <Card className="w-full min-w-0">
          <CardHeader>
            <CardTitle>Year-by-year breakdown</CardTitle>
            <CardDescription>
              One row for each full year, plus a partial year when the term
              does not end on a year boundary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduleTable rows={calculation.result.rows} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function FrequencyField({
  mode,
  frequency,
  onFrequencyChange,
}: {
  mode: InterestMode
  frequency: CompoundFrequency
  onFrequencyChange: (groupValue: string[]) => void
}) {
  switch (mode) {
    case "simple":
      return null
    case "compound":
      return (
        <Field>
          <FieldTitle id="frequency-label">Compounding frequency</FieldTitle>
          <FieldDescription id="frequency-description">
            How often interest is added to the balance.
          </FieldDescription>
          <ToggleGroup
            variant="outline"
            size="sm"
            className="w-full flex-wrap"
            aria-labelledby="frequency-label"
            aria-describedby="frequency-description"
            value={[frequency]}
            onValueChange={onFrequencyChange}
          >
            {COMPOUND_FREQUENCIES.map((option) => (
              <ToggleGroupItem key={option} value={option}>
                {frequencyLabel(option)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      )
    default: {
      const unreachable: never = mode
      return unreachable
    }
  }
}

function isInterestMode(value: string | undefined): value is InterestMode {
  return INTEREST_MODES.some((option) => option === value)
}

function isTimeUnit(value: string | undefined): value is TimeUnit {
  return TIME_UNITS.some((option) => option === value)
}

function isCompoundFrequency(
  value: string | undefined,
): value is CompoundFrequency {
  return COMPOUND_FREQUENCIES.some((option) => option === value)
}

function frequencyLabel(frequency: CompoundFrequency): string {
  switch (frequency) {
    case "annually":
      return "Annually"
    case "semiannually":
      return "Semiannually"
    case "quarterly":
      return "Quarterly"
    case "monthly":
      return "Monthly"
    case "daily":
      return "Daily"
    default: {
      const unreachable: never = frequency
      return unreachable
    }
  }
}

function Results({
  calculation,
}: {
  calculation: ReturnType<typeof calculateInterest>
}) {
  switch (calculation.status) {
    case "invalid":
      return (
        <Empty className="border">
          <EmptyHeader>
            <EmptyDescription>{EMPTY_RESULTS_MESSAGE}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    case "overflow":
      return (
        <p role="alert" className="text-sm text-destructive">
          {OVERFLOW_MESSAGE}
        </p>
      )
    case "ready":
      return (
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Interest earned</dt>
            <dd className="font-heading text-2xl font-medium tabular-nums">
              {formatUsd(calculation.result.interest)}
            </dd>
          </div>
          <Separator />
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Final amount</dt>
            <dd className="font-heading text-2xl font-medium tabular-nums">
              {formatUsd(calculation.result.finalAmount)}
            </dd>
          </div>
        </dl>
      )
    default: {
      const unreachable: never = calculation
      return unreachable
    }
  }
}

function ScheduleTable({ rows }: { rows: ScheduleRow[] }) {
  return (
    <Table>
      <TableCaption>Year-by-year interest schedule</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Period</TableHead>
          <TableHead scope="col" className="text-right">
            Interest this period
          </TableHead>
          <TableHead scope="col" className="text-right">
            Cumulative interest
          </TableHead>
          <TableHead scope="col" className="text-right">
            Balance
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableCell>{row.label}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatUsd(row.interest)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatUsd(row.cumulativeInterest)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatUsd(row.balance)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
