import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "inline-block shrink-0 animate-spin rounded-full border-muted border-t-primary motion-reduce:animate-none",
  {
    variants: {
      size: {
        sm: "size-4 border-2",
        md: "size-6 border-[3px]",
        lg: "size-8 border-4",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

function Spinner({
  className,
  size = "md",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof spinnerVariants>) {
  return (
    <div
      data-slot="spinner"
      data-size={size}
      role="status"
      aria-label="Loading"
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  )
}

export { Spinner, spinnerVariants }
