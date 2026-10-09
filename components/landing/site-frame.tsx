import type { ReactNode } from "react"
import Link from "next/link"

import { Separator } from "@/components/ui/separator"
import { LinkButton } from "@/components/landing/link-button"

export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="bg-dots flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="w-fit rounded-md text-base font-semibold tracking-tight text-foreground focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
          >
            Slotly
          </Link>
          <nav aria-label="Account" className="flex flex-wrap items-center gap-2">
            <LinkButton href="/sign-in" variant="ghost" size="sm">
              Sign in
            </LinkButton>
            <LinkButton href="/sign-up" variant="outline" size="sm">
              Sign up
            </LinkButton>
            <LinkButton href="/profile" variant="ghost" size="sm">
              Profile
            </LinkButton>
          </nav>
        </div>
        <Separator />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <footer>
        <Separator />
        <div className="mx-auto flex w-full max-w-5xl px-6 py-8">
          <p className="text-sm font-medium text-foreground">Slotly</p>
        </div>
      </footer>
    </div>
  )
}
