import { Faq } from "@/components/landing/faq"
import { guides } from "@/lib/landing-content"

export function Guides() {
  return (
    <section
      id="guides"
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-20"
    >
      <h2 className="text-3xl font-medium tracking-tight md:text-4xl">{guides.title}</h2>
      <Faq items={guides.items} />
    </section>
  )
}
