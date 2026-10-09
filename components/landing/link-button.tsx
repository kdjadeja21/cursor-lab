import type { ComponentProps, ReactNode } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

type LinkButtonProps = {
  href: string
  children: ReactNode
  variant?: ComponentProps<typeof Button>["variant"]
  size?: ComponentProps<typeof Button>["size"]
}

export function LinkButton({
  href,
  children,
  variant = "default",
  size = "default",
}: LinkButtonProps) {
  return (
    <Button
      nativeButton={false}
      render={<Link href={href} />}
      variant={variant}
      size={size}
    >
      {children}
    </Button>
  )
}
