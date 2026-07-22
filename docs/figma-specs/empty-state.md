# Empty state (Figma node 49:22)

## Empty State component (single variant, node 81:26)

Pattern: centered icon tile + heading + one-line explanation + primary action. Reused for no-results, blocked/permission, empty lists & kanban columns.

### Container
- `bg: var(--card)` (white), `border: 1px solid var(--border)` (#e9e9e9), `rounded-[14px]`
- Vertical flex, `items-center`, gap 12px, padding `px-8 py-10` (32px / 40px)
- Example width in spec: 460px (in app, fills the empty region)

### Icon tile
- 48×48 circle (`rounded-full`), `bg: var(--muted)` (#f6f6f6), flex-centered
- Icon inside: 22×22 (search/filter glyph in the example; use lucide icon at ~22px, muted-foreground color)

### Title
- "No rates match your filters" (example copy)
- Heading/H4 (Card title): Inter Medium 16px / 24px line-height, tracking -0.16px (~`tracking-tight`), color `var(--foreground)` (#1a1a1a) → `text-base font-medium`

### Description
- Body/Small: Inter Regular 14px / 20px, tracking -0.14px, color `var(--muted-foreground)` (#4c4c4c), `text-center`, wraps to container width → `text-sm text-muted-foreground text-center`

### Action button (primary, small)
- `bg: var(--primary)` (#2e5630), text `var(--primary-foreground)` (#fafafa)
- Height 32px (`h-8`), horizontal padding 14px, `rounded-[10px]`
- Label: Caption/Large — Inter Medium 14px / 20px, tracking -0.07px → `text-sm font-medium`
- Matches shadcn `<Button size="sm">` with h-8 / px-3.5 / rounded-[10px]

### Section header (docs framing, not part of component)
- Title "Empty state": Heading/H3 Inter SemiBold 18/26; description: Caption/Small Inter Regular 12/16, muted-foreground.

### States / icons
- No hover/focus/disabled states shown. Only one variant. Icon is decorative, delivered as an SVG asset in Figma; substitute an equivalent lucide-react icon (e.g. SearchX/FilterX) at 22px.

## Dev notes (verbatim from Figma)
"Communicates “nothing here yet” with a next step. Centered icon tile + heading + one-line explanation + a primary action. Reused for no-results, blocked/permission, empty lists & kanban columns. Keep copy encouraging, not error-like." (node 49:25, Caption/Small gray annotation)

## Code target
Likely a new shared component, e.g. /Users/sedaghukasyan/Desktop/atlantic-rms-prototype-main/app/components/empty-state.tsx (or inline in rates/filter list views)
