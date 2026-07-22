# Breakpoints (Figma node 36:111)

## Breakpoints (documentation section — token definitions, not a styled component)

Defines the responsive breakpoint scale for the app. These match Tailwind v4 defaults, so no custom `--breakpoint-*` theme overrides are needed — the value of this section is the **usage rules** per breakpoint:

| Token | Value | Usage |
|---|---|---|
| `breakpoint/sm` | 640px | Tablet — 1-col → 2-up grids, rows go horizontal |
| `breakpoint/md` | 768px | Sidebar rail ↔ off-canvas drawer boundary |
| `breakpoint/lg` | 1024px | Desktop — final grid density, two-pane tools |
| `breakpoint/xl` | 1280px | **Unused** (content capped via `max-w` instead) |
| `breakpoint/2xl` | 1536px | **Unused** |

Implementation guidance:
- Only use `sm:`, `md:`, `lg:` responsive prefixes; do not write `xl:`/`2xl:` styles — cap content width with a `max-w-*` container instead.
- `md` is the boundary where the sidebar switches between a persistent rail and an off-canvas drawer (e.g. shadcn Sheet below `md`, fixed sidebar at `md+`).
- Grids: single column below `sm`, 2-up at `sm`, final density at `lg`; stacked rows become horizontal (`flex-col sm:flex-row`) at `sm`.

### Styling of the spec table itself (only if rendering this doc page)
- Column list: `flex flex-col gap-3` (gap 12px); each row `flex items-center gap-4` (16px), overflow clipped.
- Token name: 130px fixed width, Caption/Medium — Inter 12px/16px, weight 500, tracking -0.5px (≈ `text-xs font-medium`), color `var(--foreground)` (#1A1A1A).
- Value: 70px fixed width, same Caption/Medium, color `var(--primary)` (#2E5630).
- Description: Caption/Small — Inter 12px/16px weight 400, `whitespace-nowrap`, color `var(--muted-foreground)` (#4C4C4C).

## Dev notes (verbatim from Figma)
Gray annotation text per row (verbatim): "Tablet — 1-col → 2-up grids, rows go horizontal" (sm 640px); "Sidebar rail ↔ off-canvas drawer boundary" (md 768px); "Desktop — final grid density, two-pane tools" (lg 1024px); "Unused (content capped via max-w instead)" (xl 1280px); "Unused" (2xl 1536px).

## Code target
tailwind theme/app/globals.css (no override needed — Tailwind defaults); layout components using responsive prefixes (sidebar/grid layouts)
