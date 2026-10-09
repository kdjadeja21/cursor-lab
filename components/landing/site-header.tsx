"use client"

import { useState } from "react"

import { DownloadLink } from "@/components/landing/download-actions"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { hero, navLinks } from "@/lib/landing-content"

const navLinkClass =
  "text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <a href="#top" className="text-sm font-medium tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          {hero.eyebrow}
        </a>
        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-5 sm:flex" aria-label="Sections">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className={navLinkClass}>
                {link.label}
              </a>
            ))}
          </nav>
          <DownloadLink place="header" />
          <Button
            variant="outline"
            size="sm"
            className="sm:hidden"
            aria-expanded={open}
            aria-controls="mobile-section-nav"
            onClick={() => setOpen((current) => !current)}
          >
            {open ? "Close" : "Menu"}
          </Button>
        </div>
      </div>
      <nav
        id="mobile-section-nav"
        aria-label="Sections"
        hidden={!open}
        className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 pb-4 sm:hidden"
      >
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => setOpen(false)}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <Separator />
    </header>
  )
}
