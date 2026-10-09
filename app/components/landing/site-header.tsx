export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <a
          href="/"
          className="text-lg font-semibold tracking-tight text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
        >
          Harbor
        </a>
        <nav aria-label="Primary">
          <a
            href="#features"
            className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          >
            Features
          </a>
        </nav>
      </div>
    </header>
  );
}
