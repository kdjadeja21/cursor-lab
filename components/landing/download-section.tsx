import { DownloadActions } from "@/components/landing/download-actions"
import { closer, downloadSection } from "@/lib/landing-content"

export function DownloadSection() {
  return (
    <section
      id="download"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-20"
    >
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-3xl font-medium tracking-tight text-balance md:text-4xl">
          {downloadSection.title}
        </h2>
        <p className="text-lg leading-relaxed text-muted-foreground">
          {downloadSection.body}
        </p>
      </div>
      <DownloadActions />
    </section>
  )
}

export function MeetFirstBot() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-20">
      <h2 className="text-3xl font-medium tracking-tight text-balance md:text-5xl">
        {closer.title}
      </h2>
      <DownloadActions />
    </section>
  )
}
