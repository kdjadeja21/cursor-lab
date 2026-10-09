import type { ReactNode } from "react"
import type { VariantProps } from "class-variance-authority"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type LinkButtonProps = VariantProps<typeof buttonVariants> & {
  href: string
  children: ReactNode
  className?: string
}

export function LinkButton({
  href,
  children,
  variant = "default",
  size = "default",
  className,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {children}
    </Link>
  )
}
