import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "w-full min-w-0 border border-input bg-background text-foreground transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive dark:bg-input/30",
  {
    variants: {
      size: {
        sm: "h-8 rounded-lg px-2.5 text-sm",
        default: "h-10 rounded-[10px] px-3 text-sm",
        lg: "h-11 rounded-[10px] px-3.5 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Input({
  className,
  type,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(inputVariants({ size, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
