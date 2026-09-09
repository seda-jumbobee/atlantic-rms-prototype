"use client"

import * as React from "react"
import { AlertCircle, Eye, EyeOff, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/* ============================================================================
   RMS / Form Field — label + control + helper/error, 6px gaps.

   Mirrors the Figma Form Field component:
   • Required shows a red asterisk directly beside the label. Optional fields
     are NOT annotated with "(optional)".
   • Helper text only where it adds context; the error message replaces it.
   • Error pairs colour with an icon and a message, and sets aria-invalid —
     never colour alone.
   ========================================================================= */

export function FieldLabel({
  htmlFor,
  required,
  children,
  className,
}: {
  htmlFor: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("flex items-center gap-0.5 text-label text-[var(--c-input-label)]", className)}
    >
      {children}
      {required && (
        <>
          <span aria-hidden className="text-[var(--c-input-required)]">
            *
          </span>
          <span className="sr-only">(required)</span>
        </>
      )}
    </label>
  )
}

export function FieldHelper({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="text-caption text-[var(--c-input-helper)]">
      {children}
    </p>
  )
}

export function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-1.5 text-caption text-[var(--c-input-error)]"
    >
      <AlertCircle aria-hidden className="mt-px size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

export function Field({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("flex flex-col gap-1.5", className)}>{children}</div>
}

/* ============================================================================
   TextField — the composite used across the product. One component covers
   text / email / password / search / number so screens never re-assemble a
   field by hand.
   ========================================================================= */

type TextFieldProps = Omit<React.ComponentProps<"input">, "size" | "type"> & {
  label: string
  type?: "text" | "email" | "password" | "search" | "number" | "tel"
  required?: boolean
  helper?: React.ReactNode
  error?: React.ReactNode
  /** Visually hide the label but keep it for assistive tech. */
  hideLabel?: boolean
  containerClassName?: string
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      type = "text",
      required,
      helper,
      error,
      hideLabel,
      className,
      containerClassName,
      id: idProp,
      ...props
    },
    ref
  ) {
    const auto = React.useId()
    const id = idProp ?? `f-${auto}`
    const helperId = `${id}-helper`
    const errorId = `${id}-error`
    const [revealed, setRevealed] = React.useState(false)

    const isPassword = type === "password"
    const isSearch = type === "search"
    const describedBy =
      [error ? errorId : null, helper ? helperId : null].filter(Boolean).join(" ") || undefined

    const control = (
      <Input
        ref={ref}
        id={id}
        // A revealed password must stay type=text so managers/AT read it correctly.
        type={isPassword ? (revealed ? "text" : "password") : type}
        // Forms use noValidate + custom messaging, so the requirement is
        // announced via aria-required rather than the native constraint.
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(isSearch && "pl-9", isPassword && "pr-10", className)}
        {...props}
      />
    )

    return (
      <Field className={containerClassName}>
        <FieldLabel htmlFor={id} required={required} className={hideLabel ? "sr-only" : undefined}>
          {label}
        </FieldLabel>

        {isPassword || isSearch ? (
          <div className="relative">
            {isSearch && (
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-tertiary"
              />
            )}
            {control}
            {isPassword && (
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                // Not a form control the user must tab through before the CTA;
                // still reachable, still labelled.
                className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-sm text-fg-tertiary hover:text-foreground"
                aria-label={revealed ? "Hide password" : "Show password"}
                aria-pressed={revealed}
              >
                {revealed ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
              </button>
            )}
          </div>
        ) : (
          control
        )}

        {error ? (
          <FieldError id={errorId}>{error}</FieldError>
        ) : helper ? (
          <FieldHelper id={helperId}>{helper}</FieldHelper>
        ) : null}
      </Field>
    )
  }
)

/** Read-only value display — used for the email/company on account activation. */
export function ReadOnlyField({
  label,
  value,
  className,
}: {
  label: string
  value: React.ReactNode
  className?: string
}) {
  const id = React.useId()
  return (
    <Field className={className}>
      <span id={id} className="text-label text-[var(--c-input-label)]">
        {label}
      </span>
      <div
        aria-labelledby={id}
        className="flex h-11 items-center rounded-md border border-border-divider bg-[var(--c-input-bg-readonly)] px-3 text-body text-muted-foreground"
      >
        {value}
      </div>
    </Field>
  )
}
