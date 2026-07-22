# Chart categorical (Figma node 34:62)

## Chart categorical — token swatch spec

This section defines the 5 categorical chart color tokens for the design system. It is a token spec, not a UI component: the actionable output is updating the `--chart-1`…`--chart-5` CSS variables in globals.css (Tailwind v4 `@theme` / shadcn token block).

### Token values (light mode as shown)
| Token | Hex |
|---|---|
| `--chart-1` | `#2E5630` (JumboBee Primary/main, dark green) |
| `--chart-2` | `#8FAA5D` (muted olive green) |
| `--chart-3` | `#F09731` (orange) |
| `--chart-4` | `#51BC51` (bright green) |
| `--chart-5` | `#4C7935` (JumboBee Primary/light, mid green) |

### Swatch presentation (if rendering the palette page itself)
- Section: vertical stack, `gap-3` (12px); swatch row wraps, `flex flex-wrap gap-3`.
- Section label "Chart categorical": Inter Medium 14/20, letter-spacing -0.07px, color `var(--muted-foreground)` (#4C4C4C). Named style: Caption/Large.
- Each swatch tile: column, `gap-1.5` (6px), fixed width 150px.
  - Color block: h-48px, w-full, `rounded-[8px]` (rounded-lg), 1px solid border `var(--border)` (#E9E9E9), background = the chart var.
  - Label ("chart-1" etc.): Inter Regular 11px / 14px line-height, letter-spacing -0.055px, color `var(--foreground)` (#1A1A1A).

### Notes
- All colors bound to shadcn-named vars with fallbacks: `var(--chart-N, hex)`, `var(--border, #e9e9e9)`, `var(--foreground, #1a1a1a)`, `var(--muted-foreground, #4c4c4c)`.
- No states (hover/focus/disabled), no icons, no size variants in this node.
- Only light-mode values shown; no dark-mode overrides present in this node.

## Dev notes (verbatim from Figma)
(none)

## Code target
app/globals.css (or src/app/globals.css) — the :root/@theme block defining --chart-1..--chart-5
