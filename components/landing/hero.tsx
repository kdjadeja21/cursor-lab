import { headline, offer } from "@/components/landing/copy"
import { LinkButton } from "@/components/landing/link-button"

export function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 pt-16 pb-20 md:pt-28 md:pb-28">
      <h1 className="max-w-[16ch] text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
        {headline}
      </h1>
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
