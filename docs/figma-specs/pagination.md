# Pagination (Figma node 46:52)

## Pagination — spec

Horizontal row of page controls: `‹ Prev` · `1` (active) · `2` · `3` · `…` · `8` · `Next ›`.

**Container**: flex row, `items-center`, **gap 6px**.

**Item (shared)**: height **32px**, horizontal padding **10px** (width hugs content), flex centered, **rounded 8px** (`rounded-lg`), no shadow.

**Typography (all items)**: Inter Medium — 14px / 20px line-height / weight 500, letter-spacing -0.07px (named style: **Caption/Large**). Tailwind: `text-sm font-medium leading-5`.

**Variants**:
- **Prev / Next**: 1px solid border `var(--border)` (#e9e9e9), transparent bg, text `var(--muted-foreground)` (#4c4c4c). Labels use text glyphs `‹ Prev` / `Next ›` (no icon components in design).
- **Page (inactive)**: 1px solid border `var(--border)`, transparent bg, text `var(--foreground)` (#1a1a1a).
- **Page (active)**: bg `var(--primary)` (#2e5630), **no border**, text `var(--primary-foreground)` (#fafafa).
- **Ellipsis (…)**: no border, no bg, text `var(--muted-foreground)`. Same 32px/10px box.

**States**: no hover/focus/disabled variants shown in design.

**shadcn/ui mapping** (restyle `components/ui/pagination.tsx`):
- `PaginationLink`: `h-8 px-2.5 rounded-lg border border-border text-sm font-medium text-foreground` (replace default ghost-button sizing `size-9`/`h-9`).
- Active (`isActive`): `bg-primary text-primary-foreground border-transparent` (instead of outline variant).
- `PaginationPrevious`/`PaginationNext`: same box as links but `text-muted-foreground`; design uses text chevrons rather than ChevronLeft/Right icons — keeping lucide icons at 14–16px is an acceptable equivalent.
- `PaginationEllipsis`: `h-8 px-2.5 text-muted-foreground`, borderless.
- Root nav: `flex items-center gap-1.5` (6px).

**Section header docs** (title "Pagination", Heading/H3 18/26 SB; description Caption/Small 12/16 regular, muted): "Navigate large result sets. Prev/Next + numbered pages with active highlight and truncation (…). Pair with a 'N of M' count. A11y: nav landmark, aria-current on the active page."

## Dev notes (verbatim from Figma)
"Navigate large result sets. Prev/Next + numbered pages with active highlight and truncation (…). Pair with a “N of M” count. A11y: nav landmark, aria-current on the active page."

## Code target
components/ui/pagination.tsx (shadcn/ui) in /Users/sedaghukasyan/Desktop/atlantic-rms-prototype-main/app
