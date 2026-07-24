import { expiryLabel, ACTIVATION_TOKEN_TTL_HOURS, RESET_TOKEN_TTL_HOURS } from "@/lib/auth/companies";
import type { DevEmail, EmailTemplateId } from "@/lib/auth/access-store";

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Atlantic RMS transactional email templates.
//
// One branded frame, one primary CTA per email, consistent typography, and a
// plain-text fallback. Rendered in the development email preview — this project
// has no email provider, so nothing is actually delivered.
// ─────────────────────────────────────────────────────────────────────────────

interface EmailContent {
  heading: string;
  lines: string[]; // body paragraphs (plain text)
  cta?: { label: string; href: string };
  note?: string; // small supporting line under the CTA
}

export function emailContent(email: DevEmail): EmailContent {
  const d = email.data;
  switch (email.template) {
    case "request-received":
      return {
        heading: "We received your access request",
        lines: [
          `Hi ${d.firstName},`,
          `We received your request to access Atlantic RMS for ${d.companyName}.`,
          "An administrator will review it, and we’ll email you when a decision is made.",
          "You don’t need to submit another request.",
        ],
      };
    case "approved":
    case "resend-setup":
      return {
        heading: "Your Atlantic RMS access is approved",
        lines: [
          `Hi ${d.firstName},`,
          `Your request to access Atlantic RMS for ${d.companyName} has been approved.`,
          "Create your password to finish setting up your account.",
        ],
        cta: { label: "Create password", href: d.link },
        note: `This link expires in ${expiryLabel(ACTIVATION_TOKEN_TTL_HOURS)}. If you didn’t request access, you can ignore this email.`,
      };
    case "rejected":
      return {
        heading: "Update on your access request",
        lines: [
          `Hi ${d.firstName},`,
          `Your request to access Atlantic RMS for ${d.companyName} was not approved.`,
          ...(d.reason ? [`Reason: ${d.reason}`] : []),
          "If you believe this is a mistake or need more information, contact your administrator.",
        ],
      };
    case "password-reset":
      return {
        heading: "Reset your Atlantic RMS password",
        lines: [
          `Hi ${d.firstName},`,
          "We received a request to reset your Atlantic RMS password.",
        ],
        cta: { label: "Reset password", href: d.link },
        note: `This link expires in ${expiryLabel(RESET_TOKEN_TTL_HOURS)}. If you didn’t request this, you can ignore this email.`,
      };
    case "password-changed":
      return {
        heading: "Your password was changed",
        lines: [
          `Hi ${d.firstName},`,
          "Your Atlantic RMS password was just changed.",
          "If this wasn’t you, contact your administrator right away.",
        ],
      };
  }
}

export const EMAIL_TEMPLATE_LABEL: Record<EmailTemplateId, string> = {
  "request-received": "Request received",
  approved: "Request approved / create password",
  "resend-setup": "Resend account-setup link",
  rejected: "Request rejected",
  "password-reset": "Password reset",
  "password-changed": "Password changed",
};

/** Plain-text alternative (accessible fallback). */
export function emailPlainText(email: DevEmail): string {
  const c = emailContent(email);
  const parts = [`Subject: ${email.subject}`, "", ...c.lines];
  if (c.cta) parts.push("", `${c.cta.label}: ${c.cta.href}`);
  if (c.note) parts.push("", c.note);
  parts.push("", "Atlantic RMS", "Rate Management");
  return parts.join("\n");
}

/** Branded HTML-style rendering used in the dev preview. */
export function EmailBody({ email }: { email: DevEmail }) {
  const c = emailContent(email);
  return (
    <div className="mx-auto max-w-[560px] overflow-hidden rounded-xl border bg-card">
      <div className="border-b bg-primary px-6 py-4 text-primary-foreground">
        <div className="text-sm font-semibold tracking-tight">Atlantic RMS</div>
        <div className="text-xs opacity-80">Rate Management</div>
      </div>
      <div className="space-y-4 px-6 py-6 text-sm leading-relaxed text-foreground">
        <h1 className="text-lg font-semibold">{c.heading}</h1>
        {c.lines.map((l, i) => (
          <p key={i} className={l.startsWith("Reason:") ? "rounded-md bg-muted p-2 text-muted-foreground" : "text-muted-foreground"}>{l}</p>
        ))}
        {c.cta && (
          <p>
            <a href={c.cta.href} className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground no-underline hover:bg-primary/90">
              {c.cta.label}
            </a>
          </p>
        )}
        {c.note && <p className="text-xs text-muted-foreground">{c.note}</p>}
      </div>
      <div className="border-t bg-muted/40 px-6 py-4 text-xs text-muted-foreground">
        <div className="font-medium text-foreground">Atlantic RMS</div>
        <div>Rate Management</div>
        <div className="mt-1">Questions? Contact your Atlantic RMS administrator.</div>
      </div>
    </div>
  );
}
