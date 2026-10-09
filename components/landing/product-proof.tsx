import { openTimes, productPoints } from "@/components/landing/copy"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ProductProof() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16 md:py-24" aria-labelledby="product-heading">
      <div className="flex max-w-[68ch] flex-col gap-3">
        <h2 id="product-heading" className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
          The booking page, your hours, your calendar
        </h2>
        <p className="text-pretty text-base leading-7 text-muted-foreground">
          The page they book on is the product. No extra tools around it.
        </p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <h3>Your booking page</h3>
            </CardTitle>
            <CardDescription>Open times on the link you share.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {openTimes.map((day) => (
              <div key={day.day} className="flex flex-col gap-2">
                <p className="text-sm font-medium text-foreground">{day.day}</p>
                <ul className="flex flex-wrap gap-2">
                  {day.times.map((time) => (
                    <li key={time}>
                      <Badge variant="outline">{time}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
        {/* Product points use Card: shadcn composition outranks Impeccable's anti-card default. */}
        <ul className="flex flex-col gap-4">
          {productPoints.map((point) => (
            <li key={point.title}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    <h3>{point.title}</h3>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{point.detail}</CardDescription>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
