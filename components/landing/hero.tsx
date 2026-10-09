import { DownloadLink } from "@/components/landing/download-actions"
import { hero } from "@/lib/landing-content"

export function Hero() {
  return (
    <section
      id="top"
      className="mx-auto flex min-h-[78vh] w-full max-w-6xl scroll-mt-24 flex-col justify-end gap-10 px-6 pt-16 pb-20"
    >
      <div className="flex max-w-4xl flex-col gap-5">
        <p className="text-sm font-medium text-muted-foreground">{hero.eyebrow}</p>
        <h1 className="text-5xl font-medium tracking-tight text-balance md:text-7xl">
          {hero.title}
        </h1>
      </div>
      <div className="grid max-w-5xl gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">{hero.messageTitle}</h2>
          <p className="leading-relaxed text-muted-foreground">{hero.messageBody}</p>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">{hero.manyTitle}</h2>
          <p className="leading-relaxed text-muted-foreground">{hero.manyBody}</p>
        </div>
      </div>
      <DownloadLink place="hero" />
    </section>
  )
}
