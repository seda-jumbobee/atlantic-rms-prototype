import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * RMS / Button — mirrors the Figma variant set (Variant x Size x State).
 *
 * Heights come from RMS/Sizing: `default`/`lg` = 44px (the standard primary
 * control height at every breakpoint), `sm` = 32px (compact; below the 44px
 * touch target, so desktop/dense surfaces only). Radius is always 8px.
 *
 * Focus is a 2px outline in --ring with a 2px offset, applied as a utility so
 * it wins over the imported shadcn base (a generic rule in globals.css loses
 * the cascade to it). --ring is primary/400, NOT primary/700, because
 * primary/700 is this button's own fill and a same-colour ring is invisible on
 * it; the offset keeps the ring readable on the amber secondary fill too.
 *
 * Existing variant and size names are preserved so call sites keep working.
 */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center",
    "rounded-md border border-transparent bg-clip-padding whitespace-nowrap",
    "text-btn font-bold transition-colors select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none",
    "aria-invalid:border-destructive",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary — white label on the brand indigo (13.29:1)
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active disabled:bg-muted disabled:text-fg-disabled",
        // Secondary — the amber accent. DARK label: white on #FFB051 is 1.81:1 and fails.
        "brand-secondary":
          "bg-brand-secondary text-brand-secondary-foreground hover:bg-brand-secondary-hover active:bg-brand-secondary-active disabled:bg-muted disabled:text-fg-disabled",
        // Outline / gray — white surface with the 3:1 control boundary
        outline:
          "border-border-strong bg-card text-foreground hover:bg-surface-hover active:bg-surface-pressed aria-expanded:bg-surface-hover disabled:border-border-divider disabled:text-fg-disabled disabled:bg-card",
        // Neutral filled
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-surface-pressed active:bg-surface-pressed aria-expanded:bg-surface-pressed disabled:text-fg-disabled",
        // Text / ghost — brand-coloured label, no chrome until hover
        ghost:
          "text-primary hover:bg-surface-hover active:bg-surface-pressed aria-expanded:bg-surface-hover disabled:text-fg-disabled",
        // Destructive — solid error, white label (4.97:1), per Figma
        destructive:
          "focus-visible:outline-destructive bg-destructive text-destructive-foreground hover:bg-destructive-hover active:bg-destructive-hover disabled:bg-muted disabled:text-fg-disabled",
        // Tinted destructive, for lower-emphasis destructive affordances
        "destructive-subtle":
          "bg-status-negative-bg text-status-negative-fg hover:bg-status-negative-border active:bg-status-negative-border disabled:bg-muted disabled:text-fg-disabled",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // 44px — the standard control height
        default: "h-11 gap-2 px-4 min-w-[88px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-11 gap-2 px-4 min-w-[88px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        // 32px — compact (Figma Size=32). Desktop/dense only.
        sm: "h-8 gap-1.5 px-3 min-w-[72px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        // 24px — dense chips. Not in the Figma set; kept for existing table/inline uses.
        xs: "h-6 gap-1 rounded-sm px-2 text-body-sm min-w-0 [&_svg:not([class*='size-'])]:size-3",
        icon: "size-11",
        "icon-lg": "size-11",
        "icon-sm": "size-8",
        "icon-xs": "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Shows a spinner, blocks pointer events and marks the control busy. */
    loading?: boolean
    /** Replaces the label while loading, e.g. "Logging in…". */
    loadingText?: string
  }

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  // asChild renders a foreign element (usually a Link) — a spinner cannot be
  // injected into it without breaking Slot's single-child contract.
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    )
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled ?? loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  )
}

export { Button, buttonVariants }
