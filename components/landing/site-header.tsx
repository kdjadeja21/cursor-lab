import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { downloadHref, hero, navLinks } from "@/lib/landing-content"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <a
          href="#top"
          className="text-sm font-medium tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {hero.eyebrow}
        </a>
        <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hidden text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 sm:inline"
            >
              {link.label}
            </a>
          ))}
          <Button
            size="sm"
            nativeButton={false}
            render={
              <a
                href={downloadHref}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Download
          </Button>
        </nav>
      </div>
      <Separator />
    </header>
  )
}
