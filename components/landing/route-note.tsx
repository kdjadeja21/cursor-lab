import type { ReactNode } from "react"

import { LinkButton } from "@/components/landing/link-button"

export function RouteNote({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4 px-6 py-24">
      <h1 className="text-balance text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="max-w-[65ch] text-pretty text-base leading-7 text-muted-foreground">
        {children}
      </p>
      <div>
        <LinkButton href="/" variant="outline">
          Back to Slotly
        </LinkButton>
      </div>
    </section>
  )
}
