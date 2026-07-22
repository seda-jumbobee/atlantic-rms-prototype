# Skeleton (Figma node 50:2)

## Skeleton — design spec

**Purpose (designer description, node 50:5):** "Placeholder shown while content loads (animated pulse). Mirror the final layout's shape so the transition is calm. Prefer over spinners for content areas; use a spinner only for indeterminate actions."

**One example shown:** "Content placeholder (pulsing)" — a card containing skeleton shapes (a card-with-avatar loading state).

### Demo card container (context, not the Skeleton primitive itself)
- `bg: var(--card)` (white), `border: 1px solid var(--border)` (#e9e9e9), `rounded-[14px]`, `p-4` (16px), width 320px
- Horizontal flex, `gap-3` (12px), items-start

### Skeleton primitive styles
- Fill: `var(--muted)` (#f6f6f6) — matches shadcn default `bg-muted` (JumboBee Card/light #F6F6F6)
- Animation: pulse (keep shadcn `animate-pulse`)
- Shapes in the example:
  - **Avatar:** circle, 40x40 (`size-10 rounded-full`)
  - **Line 1:** h-3 (12px), full width, `rounded-[6px]`
  - **Line 2:** h-3 (12px), w-[120px], `rounded-[6px]`
  - **Block/badge:** h-6 (24px), w-[60px], `rounded-[6px]`
- Text column: vertical flex, `gap-2` (8px), flex-1

### Implication for shadcn Skeleton component
- shadcn default is `bg-accent` or `bg-primary/10` + `rounded-md` + `animate-pulse`; this design wants `bg-muted` and 6px radius for bar shapes (`rounded-md` at default Tailwind = 6px, so `rounded-md` matches). Circle variants use `rounded-full`.

### Section header typography (docs page chrome, not component)
- Title: Heading/H3 — Inter Semi Bold 18/26, tracking -0.18px (-1%), color `var(--foreground)` (#1a1a1a)
- Description: Caption/Small — Inter Regular 12/16, tracking -0.5%, color `var(--muted-foreground)` (#4c4c4c)
- Example caption: Inter Regular 11/14, `var(--muted-foreground)`
- Layout: column gap 14px between header and examples; examples wrap with row-gap 20px; label 8px below each example.

No hover/focus/disabled states, no size variants, no icons shown.

## Dev notes (verbatim from Figma)
"Placeholder shown while content loads (animated pulse). Mirror the final layout’s shape so the transition is calm. Prefer over spinners for content areas; use a spinner only for indeterminate actions." (node 50:5); example label: "Content placeholder (pulsing)" (node 50:14)

## Code target
components/ui/skeleton.tsx (shadcn/ui Skeleton)
