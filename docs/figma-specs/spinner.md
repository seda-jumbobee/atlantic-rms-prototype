# Spinner (Figma node 50:15)

## Spinner (node 50:15)

Indeterminate circular loading indicator, 3 sizes (variants nodes: Small 80:9, Medium 80:12, Large 80:15).

### Anatomy
- **Track**: full circle ring, color `var(--muted)` (#F6F6F6)
- **Arc**: partial circle segment (roughly a quarter/half arc starting at top-right — vectors occupy the right half of the box), color `var(--primary)` (#2E5630)
- Arc rotates continuously over the static track — designer note says use `animate-spin`.

### Sizes (square, width = height)
| Size | Box |
|---|---|
| Small | 16×16 (`size-4`) |
| Medium | 24×24 (`size-6`) |
| Large | 32×32 (`size-8`) |

Stroke weight scales with size (track and arc are exported vectors; implement as SVG circle with `stroke-muted` track + `stroke-primary` arc, or border-based spinner: `border-2 border-muted border-t-primary rounded-full animate-spin`, bumping border width for larger sizes).

### Colors
- Track: `var(--muted)` #F6F6F6
- Arc/indicator: `var(--primary)` #2E5630
- No border, no background, no radius beyond the circle itself; no text inside the component.

### States
None shown (indeterminate only — no hover/focus/disabled).

### Accessibility (from designer note)
Provide an accessible label, e.g. `aria-label="Loading…"` / `role="status"`, and set `aria-busy` on the containing region; intended for short waits and button loading states (Small size pairs with buttons).

### Section header typography (docs text, not part of component)
- Title "Spinner": Heading/H3 — Inter SemiBold 18/26, tracking -0.18px, `var(--foreground)` #1A1A1A
- Description: Caption/Small — Inter Regular 12/16, tracking -0.06px, `var(--muted-foreground)` #4C4C4C

## Dev notes (verbatim from Figma)
"Indeterminate activity indicator for short waits and button loading states. Rotates continuously (animate-spin). Provide an accessible label (e.g. “Loading…”, aria-busy)."

## Code target
Likely app/components/ui/spinner.tsx (shadcn/ui Spinner) in /Users/sedaghukasyan/Desktop/atlantic-rms-prototype-main/app
