"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

/** One consistent authentication layout: branding, title, supporting copy, a
    readable max width, and an optional footer. Rendered inside (auth)/layout,
    which already centers it and caps the width. */
export function AuthShell({
  title, description, children, footer, icon,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card className="border-border/70 shadow-xl">
      <CardHeader className="items-center text-center">
        {icon ?? <LogoMark className="size-12" />}
        <CardTitle className="mt-2 text-xl">{title}</CardTitle>
        {description && <CardDescription className="text-balance">{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter className="flex-col gap-2 text-center text-sm text-muted-foreground">{footer}</CardFooter>}
    </Card>
  );
}

/** Text/email field with a visible label, required asterisk, helper text, and
    error wired via aria-describedby / aria-invalid. */
export function AuthField({
  id, label, required, hint, error, ...props
}: React.ComponentProps<typeof Input> & { label: string; required?: boolean; hint?: string; error?: string | null }) {
  const errId = error ? `${id}-err` : undefined;
  const hintId = hint && !error ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        <span>{label}{required && <span aria-hidden className="ml-0.5 text-sidebar-primary">*</span>}</span>
      </Label>
      <Input id={id} aria-invalid={!!error} aria-describedby={errId ?? hintId} {...props} />
      {hintId && <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>}
      {errId && <p id={errId} role="alert" className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

/** Password field with an accessible show/hide toggle. Never blocks paste or
    password-manager autofill. */
export function PasswordField({
  id, label, required, hint, error, value, onChange, onBlur, autoComplete,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const errId = error ? `${id}-err` : undefined;
  const hintId = hint && !error ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        <span>{label}{required && <span aria-hidden className="ml-0.5 text-sidebar-primary">*</span>}</span>
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={errId ?? hintId}
          autoComplete={autoComplete}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className={cn(
            "absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-lg text-muted-foreground outline-none transition",
            "hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
          )}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {hintId && <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>}
      {errId && <p id={errId} role="alert" className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
