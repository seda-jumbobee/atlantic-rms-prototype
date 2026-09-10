import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * RMS / Input — mirrors the Figma variant set (Type x State).
 *
 * 44px field height at every breakpoint, radius 8, horizontal padding 12.
 * The surface is always WHITE so fields separate from the #FAFAFA page, and
 * the border is border/strong (#8A8A92) which holds 3:1 against both white
 * and the page — that is what satisfies WCAG 1.4.11 for a control boundary.
 *
 * Focus and Error both add weight as well as colour (never colour alone):
 * focus gets the global 2px offset ring, error thickens the boundary via an
 * inset shadow so nothing reflows.
 *
 * States: default · hover · focus · filled · disabled · read-only · error.
 */
const inputVariants = cva(
  [
    "w-full min-w-0 bg-[var(--c-input-bg)] text-[var(--c-input-value)]",
    "border border-[var(--c-input-border)] transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "placeholder:text-[var(--c-input-placeholder)]",
    "hover:border-[var(--c-input-border-hover)]",
    "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-body file:font-medium file:text-foreground",
    // disabled
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[var(--c-input-bg-disabled)] disabled:border-border-divider disabled:text-fg-disabled",
    // read-only — a distinct, non-editable surface (not the same as disabled)
    "read-only:bg-[var(--c-input-bg-readonly)] read-only:text-muted-foreground read-only:hover:border-[var(--c-input-border)]",
    // error — colour + extra boundary weight, no layout shift
    "aria-invalid:border-[var(--c-input-border-error)] aria-invalid:shadow-[inset_0_0_0_1px_var(--c-input-border-error)] aria-invalid:hover:border-[var(--c-input-border-error)]",
  ].join(" "),
  {
    variants: {
      size: {
        // 44px — the standard control height
        default: "h-11 rounded-md px-3 text-body",
        lg: "h-11 rounded-md px-3 text-body",
        // 32px — compact/dense (tables, toolbars). Below the 44px touch target.
        sm: "h-8 rounded-md px-2.5 text-body",
        // 28px — editable cells inside a dense table, where a 32px control
        // would grow every row. Declared here so those cells stop hand-rolling
        // h-7 px-1.5 and the gutter stays a system value.
        xs: "h-7 rounded-md px-1.5 text-body",
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
