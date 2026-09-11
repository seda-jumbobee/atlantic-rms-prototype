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

/* ============================================================================
   A number field sitting at 0 has that 0 replaced by the first digit typed.

   0 is what an empty numeric field holds — a cost not yet entered, a duration
   of none — so it reads as a placeholder, but it is a real value and the caret
   lands beside it. Typing 12 into a field showing 0 gave 012, or 120 with the
   caret at the front, and clearing it first only put the 0 back, because
   Number("") is 0.

   The obvious fix — select the 0 on focus so typing replaces it — DOES NOT
   WORK, and the reason is worth writing down: `input type="number"` does not
   support the selection API. selectionStart and selectionEnd read back null
   and select() is a no-op, per the spec's list of types that support
   selection. Verified in the running app: focusing a 0 field left selection
   null and typing still produced "07".

   So the replacement happens at the keystroke instead. The digit is applied
   through the native value setter plus an input event, which is what React's
   onChange actually listens to — assigning to .value alone would be
   overwritten on the next controlled render.

   Only when the whole value is exactly "0": a field holding 4500 stays
   editable. Only bare digits, so Ctrl/Cmd shortcuts, Tab, arrows, minus and
   the decimal point behave normally — typing "." into 0 still gives "0.".
   ========================================================================= */
function Input({
  className,
  type,
  size = "default",
  onKeyDown,
  ...props
}: Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(inputVariants({ size, className }))}
      onKeyDown={(e) => {
        const el = e.currentTarget
        if (
          type === "number" &&
          el.value === "0" &&
          /^[0-9]$/.test(e.key) &&
          !e.ctrlKey && !e.metaKey && !e.altKey
        ) {
          e.preventDefault()
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
          )?.set
          setter?.call(el, e.key)
          el.dispatchEvent(new Event("input", { bubbles: true }))
        }
        onKeyDown?.(e)
      }}
      {...props}
    />
  )
}

export { Input, inputVariants }
