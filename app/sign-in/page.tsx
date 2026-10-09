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
        You opened the sign-in link from the Slotly home page.
      </RouteNote>
    </SiteFrame>
  )
}
