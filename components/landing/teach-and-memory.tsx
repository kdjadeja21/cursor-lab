import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { memory, teach } from "@/lib/landing-content"

export function TeachAndMemory() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-20">
      <section className="grid items-start gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-medium tracking-tight text-balance md:text-4xl">
            {teach.title}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">{teach.body}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              <h3>{teach.routine}</h3>
            </CardTitle>
            <CardDescription>{teach.elapsed}</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{teach.action}</Badge>
          </CardContent>
          <CardFooter>{teach.speaker}</CardFooter>
        </Card>
      </section>
      <section className="flex flex-col gap-8">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="text-3xl font-medium tracking-tight text-balance md:text-4xl">
            {memory.title}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">{memory.body}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent>
              <p className="leading-relaxed">{memory.reply}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>{memory.updated}</CardDescription>
              <CardTitle>
                <h3>{memory.role}</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed">{memory.note}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
