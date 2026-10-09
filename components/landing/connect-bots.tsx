import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { connect } from "@/lib/landing-content"

export function ConnectBots() {
  return (
    <section
      id="connect"
      className="mx-auto flex w-full max-w-6xl scroll-mt-24 flex-col gap-8 px-6 py-20"
    >
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-3xl font-medium tracking-tight text-balance md:text-4xl">
          {connect.title}
        </h2>
        <p className="text-lg leading-relaxed text-muted-foreground">{connect.body}</p>
      </div>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>
            <h3>{connect.status}</h3>
          </CardTitle>
        </CardHeader>
      </Card>
    </section>
  )
}
