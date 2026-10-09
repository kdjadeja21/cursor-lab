import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { jobs } from "@/lib/landing-content"

export function Jobs() {
  return (
    <section
      id="jobs"
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-20"
    >
      <h2 className="max-w-2xl text-3xl font-medium tracking-tight text-balance md:text-4xl">
        {jobs.title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {jobs.roles.map((role) => (
          <Card
            key={role.name}
            size="sm"
            className={"description" in role ? "sm:col-span-2" : undefined}
          >
            <CardHeader>
              <CardTitle>
                <h3>{role.name}</h3>
              </CardTitle>
              {"description" in role ? (
                <CardDescription>{role.description}</CardDescription>
              ) : null}
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}
