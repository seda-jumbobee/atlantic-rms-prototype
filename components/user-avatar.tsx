import { UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/* ============================================================================
   The one way an account's picture is drawn. Used by the sidebar account
   block and by Settings, so a photo added in one place appears identically in
   the other.

   With no photo it falls back to a person glyph rather than a monogram — the
   avatar is an identity marker, not a label, and the name is always rendered
   beside it where it matters.

   Square, always. A circle crops a photo twice — once to the square the
   uploader produces, once to the round mask — and the two places this appears
   had drifted apart, the sidebar already square and Settings still round.
   The corner scales with the box so a 96px tile and a 48px one read as the
   same shape rather than the same number of pixels.
   ========================================================================= */

export function UserAvatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string;
  /** Used for the accessible description only; never drawn. */
  name?: string;
  size?: number;
  className?: string;
}) {
  /* `rounded-[var(--radius-card)]`, not `rounded-card`: the base Avatar
     hardcodes `rounded-full`, and tailwind-merge only replaces a radius class
     it recognises. It knows `rounded-md` and the arbitrary-value form, but NOT
     this project's custom `rounded-card` — with that it kept both classes and
     rounded-full won, which is why the 96px tile stayed a circle while the
     48px one went square. Same token, spelled so the merge resolves it. */
  const radius = size >= 72 ? "rounded-[var(--radius-card)]" : "rounded-md";
  return (
    <Avatar
      className={cn("shrink-0", radius, className)}
      style={{ width: size, height: size }}
    >
      {src && (
        <AvatarImage
          className={cn("object-cover", radius)}
          src={src}
          alt={name ? `${name}’s profile photo` : ""}
        />
      )}
      <AvatarFallback className={cn("bg-muted text-muted-foreground", radius)}>
        <UserRound aria-hidden style={{ width: size * 0.5, height: size * 0.5 }} />
        <span className="sr-only">{name ? `${name} — no profile photo` : "No profile photo"}</span>
      </AvatarFallback>
    </Avatar>
  );
}
