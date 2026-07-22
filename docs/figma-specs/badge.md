# Badge (Figma node 43:6)

## Badge — spec

**Purpose:** Compact label for counts, categories, metadata. Not interactive (use Button for actions). Keep text to 1–2 words.

**Container (all variants):**
- inline-flex, items-center, justify-center
- Padding: `px-[8px] py-[2px]` (8px horizontal, 2px vertical)
- Radius: `rounded-full` (999px pill)
- No fixed height (2px py + 16px line-height ≈ 20–22px tall)

**Typography (all variants):** named style **Caption/Medium** — Inter Medium, 12px / 16px line-height, weight 500, letter-spacing −0.06px (≈ `text-xs font-medium leading-4 tracking-tight`), whitespace-nowrap.

**Variants (5):**

| Variant | Background | Border | Text color |
|---|---|---|---|
| Default | `var(--primary)` (#2E5630) | none | `var(--primary-foreground)` (#FAFAFA) |
| Secondary | `var(--secondary)` (#F6F6F6) | none | `var(--secondary-foreground)` (#1A1A1A) |
| Destructive | `var(--status-negative-bg)` (#FCE4E4) — soft/tinted bg, not solid | none | `var(--destructive)` (#C41C1C) |
| Outline | transparent | 1px solid `var(--border)` (#E9E9E9) | `var(--foreground)` (#1A1A1A) |
| Ghost | transparent | none | `var(--muted-foreground)` (#4C4C4C) |

Notes vs stock shadcn Badge:
- Pill radius (rounded-full) instead of rounded-md.
- Destructive is an inverted/soft style: pale red background with red text, not white-on-red. If `--status-negative-bg` doesn't exist in the token set, add it (#FCE4E4) or approximate with `bg-destructive/10 text-destructive`.
- New `ghost` variant: no bg/border, muted-foreground text.
- Description mentions a `link` variant but none is drawn in the component set — implement only if desired (typically underlined primary text).
- No hover/focus/disabled states shown (non-interactive). No icons shown.

Section heading uses Heading/H3 (Inter SemiBold 18/26) and Caption/Small for the description — documentation only, not part of the component.

## Dev notes (verbatim from Figma)
"Compact label for counts, categories, metadata. Variants: default (primary), secondary, destructive, outline, ghost, link. Keep to 1–2 words. Not interactive (use Button for actions)."

## Code target
components/ui/badge.tsx
