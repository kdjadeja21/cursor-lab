import type { Metadata } from "next"

import { RouteNote } from "@/components/landing/route-note"
import { SiteFrame } from "@/components/landing/site-frame"

export const metadata: Metadata = {
  title: "Sign in",
}

export default function SignInPage() {
  return (
    <SiteFrame>
      <RouteNote title="Sign in">
        Sign in is coming soon.
      </RouteNote>
    </SiteFrame>
  )
}
