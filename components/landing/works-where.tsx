import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { worksWhere } from "@/lib/landing-content"

export function WorksWhere() {
  const [computer, ...rest] = worksWhere.points

  return (
    <section
      id="works"
      className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20"
    >
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-3xl font-medium tracking-tight text-balance md:text-4xl">
          {worksWhere.title}
        </h2>
        <p className="text-lg leading-relaxed text-muted-foreground">{worksWhere.body}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <h3>{computer.title}</h3>
            </CardTitle>
            <CardAction>
              <Badge>{computer.status}</Badge>
            </CardAction>
            <CardDescription>{computer.control}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{computer.prompt}</p>
          </CardContent>
          <CardFooter>{computer.speaker}</CardFooter>
        </Card>
        <div className="grid gap-4">
          {rest.map((point) => (
            <Card key={point.title} size="sm">
              <CardHeader>
                <CardTitle>
                  <h3>{point.title}</h3>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
