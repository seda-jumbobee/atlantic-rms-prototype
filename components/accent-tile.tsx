import { cn } from "@/lib/utils";

/* ============================================================================
   Accent tile — the tinted square a tool or category glyph sits on.

   The hue is decoration, not information: every card that carries one also
   names the thing and badges its category, so nothing is lost to a reader who
   cannot tell the tints apart. Its only job is to break up a dense grid.
   Palette and measured contrast live in app/globals.css (--c-accent-*).
   ========================================================================= */

export const ACCENTS = ["indigo", "violet", "green", "amber"] as const;
export type Accent = (typeof ACCENTS)[number];

// Written out rather than interpolated — Tailwind only sees whole class names.
const TINT: Record<Accent, string> = {
  indigo: "bg-[var(--c-accent-indigo-bg)] text-[var(--c-accent-indigo-fg)]",
  violet: "bg-[var(--c-accent-violet-bg)] text-[var(--c-accent-violet-fg)]",
  green: "bg-[var(--c-accent-green-bg)] text-[var(--c-accent-green-fg)]",
  amber: "bg-[var(--c-accent-amber-bg)] text-[var(--c-accent-amber-fg)]",
};

/** A stable accent for a fixed position in a list. Four accents against a
    three-column grid means no two neighbours — across or down — ever match,
    since neither 1 nor 3 is a multiple of 4. */
export function accentAt(index: number): Accent {
  const n = ACCENTS.length;
  return ACCENTS[((index % n) + n) % n];
}

export function AccentTile({
  accent,
  className,
  children,
}: {
  accent: Accent;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", TINT[accent], className)}>
      {children}
    </span>
  );
}
