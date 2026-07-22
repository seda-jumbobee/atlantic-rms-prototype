import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[72px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm leading-5 transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-2 focus-visible:border-ring aria-invalid:border-2 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
