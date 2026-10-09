import type { Metadata } from "next"

import { RouteNote } from "@/components/landing/route-note"
import { SiteFrame } from "@/components/landing/site-frame"

export const metadata: Metadata = {
  title: "Profile",
}

export default function ProfilePage() {
  return (
    <SiteFrame>
      <RouteNote title="Profile">
        Profile is where the link you share belongs.
      </RouteNote>
    </SiteFrame>
  )
}
