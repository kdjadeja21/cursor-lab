import type { Metadata } from "next"

import { RouteNote } from "@/components/landing/route-note"
import { SiteFrame } from "@/components/landing/site-frame"

export const metadata: Metadata = {
  title: "Sign up",
}

export default function SignUpPage() {
  return (
    <SiteFrame>
      <RouteNote title="Sign up">
        Sign up is coming soon.
      </RouteNote>
    </SiteFrame>
  )
}
