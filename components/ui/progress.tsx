"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  showValue = false,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  showValue?: boolean
}) {
  const bar = (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 rounded-full bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )

  if (!showValue) return bar

  return (
    <div data-slot="progress-wrapper" className="flex w-full flex-col items-start">
      {bar}
      <span
        data-slot="progress-value"
        className="mt-1.5 text-xs font-medium text-muted-foreground"
      >
        {Math.round(value ?? 0)}%
      </span>
    </div>
  )
}

export { Progress }
