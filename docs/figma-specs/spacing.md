# Spacing (Figma node 36:3)

## Spacing scale (design tokens)

A 13-step spacing scale, named with Tailwind-style indices (token = index x 4px). Matches Tailwind v4's default spacing scale exactly (`--spacing: 0.25rem`), so **no custom spacing config is needed** — use standard utilities (`p-1`, `gap-2`, `m-6`, etc.).

| Token | Value | Tailwind |
|---|---|---|
| spacing/0 | 0px | 0 |
| spacing/1 | 4px | 1 |
| spacing/2 | 8px | 2 |
| spacing/3 | 12px | 3 |
| spacing/4 | 16px | 4 |
| spacing/5 | 20px | 5 |
| spacing/6 | 24px | 6 |
| spacing/8 | 32px | 8 |
| spacing/10 | 40px | 10 |
| spacing/12 | 48px | 12 |
| spacing/16 | 64px | 16 |
| spacing/20 | 80px | 20 |
| spacing/24 | 96px | 24 |

Only these steps are sanctioned (note gaps: no 7, 9, 11, 13–15, 17–19, 21–23). Restrict spacing utilities in components to this set.

### Doc-page presentation (if rebuilding the spec page itself)
- Column: `flex flex-col gap-3 (12px)`; each row: `flex items-center gap-4 (16px)`, full width, overflow clipped.
- Token name: fixed `w-[110px]`, 12px/16px Inter Medium (style "Caption/Medium"), color `var(--foreground)` (#1a1a1a), letter-spacing -0.5.
- Swatch bar: height 16px, width = token value (0px renders as 1px), `bg-[var(--primary)]` (#2e5630), `rounded-[2px]`.
- Value label: 12px/16px Inter Regular (style "Caption/Small"), color `var(--muted-foreground)` (#4c4c4c).

Colors are bound to shadcn vars: swatches use `--primary`, labels `--foreground` / `--muted-foreground`. No states, borders, or icons in this section.

## Dev notes (verbatim from Figma)
None found — the section contains only token names (e.g. "spacing/4") and pixel values ("16px"); no gray annotation/dev-note text present.

## Code target
tailwind theme / globals.css (spacing tokens); no component file — token reference section
