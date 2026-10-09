import { MonitorIcon, SmartphoneIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  downloadHref,
  downloadPlatforms,
  platformLabel,
  platformVariant,
  type Platform,
} from "@/lib/landing-content"

function PlatformIcon({ platform }: { platform: Platform }) {
  switch (platform) {
    case "macos":
      return <MonitorIcon data-icon="inline-start" />
    case "ios":
      return <SmartphoneIcon data-icon="inline-start" />
    default: {
      const unreachable: never = platform
      return unreachable
    }
  }
}

export function DownloadActions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {downloadPlatforms.map((platform) => (
        <Button
          key={platform}
          size="lg"
          variant={platformVariant(platform)}
          nativeButton={false}
          render={
            <a href={downloadHref} target="_blank" rel="noopener noreferrer" />
          }
        >
          <PlatformIcon platform={platform} />
          {platformLabel(platform)}
        </Button>
      ))}
    </div>
  )
}
