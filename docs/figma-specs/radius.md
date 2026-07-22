# Radius (Figma node 36:57)

## Radius token scale (foundations)

A 9-step border-radius ramp. Not a component — a token spec for Tailwind v4 `--radius-*` theme values.

| Token | Value | Tailwind v4 var |
|---|---|---|
| radius/none | 0px | `--radius-none: 0px` |
| radius/sm | 6px | `--radius-sm: 6px` |
| radius/md | 8px | `--radius-md: 8px` |
| radius/lg | 10px | `--radius-lg: 10px` |
| radius/xl | 14px | `--radius-xl: 14px` |
| radius/2xl | 18px | `--radius-2xl: 18px` |
| radius/3xl | 22px | `--radius-3xl: 22px` |
| radius/4xl | 26px | `--radius-4xl: 26px` |
| radius/full | 9999px | `--radius-full: 9999px` (rounded-full) |

Implementation notes:
- shadcn convention: set base `--radius: 10px` (0.625rem) so shadcn's derived `--radius-sm/md/lg/xl` (radius −4/−2/0/+4) yield 6/8/10/14px — this scale matches that derivation exactly; 2xl–4xl extend it in +4px steps.
- Declare in `@theme` (globals.css) so `rounded-sm/md/lg/xl/2xl/3xl/4xl/full` utilities emit these exact px values.

Swatch presentation styling (only needed if rebuilding the doc page itself): each item is a column, gap 6px, centered; 64x64 tile with `bg: var(--accent)` (#E9EEE9), `border: 1.5px solid var(--primary)` (#2E5630), rounded per token; labels Inter Regular 11px/14px, tracking −0.055px — token name in `var(--foreground)` (#1A1A1A), px value in `var(--muted-foreground)` (#4C4C4C). Swatches flow in a flex-wrap row, gap 16px.

No hover/focus/disabled states, icons, or dev-note annotations present in this section.

## Dev notes (verbatim from Figma)
(none)

## Code target
app/globals.css (@theme --radius-* variables); components inherit via rounded-* utilities
