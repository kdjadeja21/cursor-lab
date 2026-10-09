import { MonitorIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { downloadHref } from "@/lib/landing-content"
import { cn } from "@/lib/utils"

export type DownloadPlace = "header" | "hero" | "download" | "closer"

function accessibleName(place: DownloadPlace): string {
  switch (place) {
    case "header":
      return "Download Grok Bot for macOS Apple silicon from the header (opens in a new tab)"
    case "hero":
      return "Download Grok Bot for macOS Apple silicon from the introduction (opens in a new tab)"
    case "download":
      return "Download Grok Bot for macOS Apple silicon from the download section (opens in a new tab)"
    case "closer":
      return "Download Grok Bot for macOS Apple silicon to meet your first Bot (opens in a new tab)"
    default: {
      const unreachable: never = place
      return unreachable
    }
  }
}

function visibleLabel(place: DownloadPlace): string {
  switch (place) {
    case "header":
      return "Download"
    case "hero":
    case "download":
    case "closer":
      return "macOS Apple silicon"
    default: {
      const unreachable: never = place
      return unreachable
    }
  }
}

function linkSize(place: DownloadPlace): "sm" | "lg" {
  switch (place) {
    case "header":
      return "sm"
    case "hero":
    case "download":
    case "closer":
      return "lg"
    default: {
      const unreachable: never = place
      return unreachable
    }
  }
}

function showsPlatformIcon(place: DownloadPlace): boolean {
  switch (place) {
    case "header":
      return false
    case "hero":
    case "download":
    case "closer":
      return true
    default: {
      const unreachable: never = place
      return unreachable
    }
  }
}

export function DownloadLink({ place }: { place: DownloadPlace }) {
  return (
    <a
      href={downloadHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={accessibleName(place)}
      className={cn(buttonVariants({ size: linkSize(place) }))}
    >
      {showsPlatformIcon(place) ? (
        <MonitorIcon data-icon="inline-start" aria-hidden="true" />
      ) : null}
      {visibleLabel(place)}
    </a>
  )
}
