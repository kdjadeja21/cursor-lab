import { steps } from "@/components/landing/copy"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function HowItWorks() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16 md:py-24" aria-labelledby="steps-heading">
      <div className="flex max-w-[68ch] flex-col gap-3">
        <h2 id="steps-heading" className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
          How it works
        </h2>
        <p className="text-pretty text-base leading-7 text-muted-foreground">
          Set your hours, share the link, and they book a time on your calendar.
        </p>
      </div>
      {/* Steps use Card: shadcn composition outranks Impeccable's anti-card default. */}
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <li key={step.label}>
            <Card className="h-full">
              <CardHeader>
                <Badge variant="secondary">{step.label}</Badge>
                <CardTitle>
                  <h3>{step.title}</h3>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{step.detail}</CardDescription>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  )
}
