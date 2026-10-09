"use client"

import { useEffect, useId, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatUsd, type InterestResult } from "@/lib/interest"

const chartConfig = {
  principal: {
    label: "Principal",
    color: "var(--chart-1)",
  },
  interest: {
    label: "Interest",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function InterestGrowthChart({
  result,
  describedBy,
}: {
  result: InterestResult
  describedBy: string
}) {
  const headingId = useId()
  const reducedMotion = usePrefersReducedMotion()
  const principal = principalOf(result)
  const rowPoints = result.rows.map((row) => ({
    label: row.partial ? `${row.year} (partial)` : String(row.year),
    principal,
    interest: row.cumulativeInterest,
  }))
  // A single period cannot draw an area, so start the series at year 0.
  const points =
    rowPoints.length === 1 ? [{ label: "0", principal, interest: 0 }, ...rowPoints] : rowPoints

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>
          <h2 id={headingId} className="text-lg font-medium">
            Principal and interest
          </h2>
        </CardTitle>
        <CardDescription>
          Each year shows the original principal and the interest earned so far.
          The table below lists the same years.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-72 w-full"
          aria-labelledby={headingId}
          aria-describedby={describedBy}
        >
          <AreaChart
            accessibilityLayer={false}
            data={points}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={84}
              tickFormatter={(value: number) => formatUsd(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value, name) => (
                    <GrowthTooltipRow name={String(name)} value={value} />
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="principal"
              stackId="balance"
              type="linear"
              stroke="var(--color-principal)"
              fill="var(--color-principal)"
              fillOpacity={0.85}
              strokeWidth={2}
              isAnimationActive={!reducedMotion}
              animationDuration={700}
            />
            <Area
              dataKey="interest"
              stackId="balance"
              type="linear"
              stroke="var(--color-interest)"
              fill="var(--color-interest)"
              fillOpacity={0.9}
              strokeWidth={2}
              isAnimationActive={!reducedMotion}
              animationDuration={700}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function GrowthTooltipRow({
  name,
  value,
}: {
  name: string
  value: unknown
}) {
  const amount = chartAmount(value)
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <span className="text-muted-foreground">{seriesLabel(name)}</span>
      <span className="font-medium text-foreground tabular-nums">
        {Number.isFinite(amount) ? formatUsd(amount) : "Too large"}
      </span>
    </div>
  )
}

function seriesLabel(name: string): string {
  switch (name) {
    case "principal":
      return "Principal"
    case "interest":
      return "Interest"
    default:
      return name
  }
}

function chartAmount(value: unknown): number {
  if (typeof value === "number") {
    return value
  }
  if (typeof value === "string") {
    return Number(value)
  }
  if (Array.isArray(value)) {
    const last: unknown = value[value.length - 1]
    return typeof last === "number" ? last : Number(last)
  }
  return Number.NaN
}

function principalOf(result: InterestResult): number {
  const start = result.rows[0]?.startBalance
  if (typeof start === "number" && Number.isFinite(start)) {
    return start
  }
  return result.finalAmount - result.interestEarned
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") {
      return true
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  })

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => {
      setReduced(query.matches)
    }
    update()
    query.addEventListener("change", update)
    return () => {
      query.removeEventListener("change", update)
    }
  }, [])

  return reduced
}
