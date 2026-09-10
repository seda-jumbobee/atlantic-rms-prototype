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
   ========================================================================= */

export function UserAvatar({
  src,
  name,
  size = 40,
  shape = "circle",
  className,
}: {
  src?: string;
  /** Used for the accessible description only; never drawn. */
  name?: string;
  size?: number;
  shape?: "circle" | "rounded";
  className?: string;
}) {
  const radius = shape === "circle" ? "rounded-full" : "rounded-md";
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
