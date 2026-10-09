export function CtaSection() {
  return (
    <section
      id="get-started"
      aria-labelledby="cta-heading"
      className="bg-white py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <h2
          id="cta-heading"
          className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl"
        >
          Ready to try Harbor?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-zinc-600">
          This is a preview landing page — signup is not wired yet.
        </p>
        <a
          href="#get-started"
          className="mt-8 inline-flex min-h-11 w-full max-w-xs items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 sm:w-auto"
        >
          Start free
        </a>
      </div>
    </section>
  );
}
