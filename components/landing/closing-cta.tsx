import { offer } from "@/components/landing/copy"
import { LinkButton } from "@/components/landing/link-button"

export function ClosingCta() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16 md:py-24" aria-labelledby="close-heading">
      <h2 id="close-heading" className="max-w-[18ch] text-balance text-3xl font-semibold tracking-tight md:text-4xl">
        Share a link. They book the time.
      </h2>
      <p className="max-w-[68ch] text-pretty text-lg leading-8 text-muted-foreground">
        {offer}
      </p>
      <div>
        <LinkButton href="/sign-up" size="lg">
          Get started
        </LinkButton>
      </div>
    </section>
  )
}
