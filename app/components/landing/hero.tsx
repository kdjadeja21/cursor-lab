import { ProductPreview } from "./product-preview";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="border-b border-zinc-200/60 bg-gradient-to-b from-white to-zinc-50/80"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:gap-12 md:py-24 lg:gap-16">
        <div className="flex flex-col items-start">
          <h1
            id="hero-heading"
            className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight"
          >
            Your notes, docs, and tasks in one calm workspace.
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-zinc-600">
            Harbor brings wikis, documents, and to-dos together so your team
            can plan and write without switching apps.
          </p>
          <a
            href="#get-started"
            className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 sm:w-auto"
          >
            Start free
          </a>
        </div>
        <ProductPreview />
      </div>
    </section>
  );
}
