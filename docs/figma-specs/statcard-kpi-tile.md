# StatCard (KPI tile) (Figma node 44:44)

## StatCard (KPI tile)

Dashboard metric tile with 4 examples (variants differ only in icon color): `accent = primary | success | warning | destructive`.

### Container
- `div` flex row, `justify-between items-start`, padding **16px** all sides, width 250px in the spec (in app: fluid within grid)
- Background `var(--card)` (white), border **1px solid var(--border)** (#e9e9e9), radius **14px** (`rounded-[14px]`)
- No shadow shown

### Left column (text stack)
Flex column, **gap 4px**, left-aligned:
1. **Label** — Caption/Medium: Inter 12px, weight 500, line-height 16px, tracking -0.06px (-0.5%), color `var(--muted-foreground)` (#4c4c4c). e.g. "Open quotes"
2. **Value** — Heading/H1: Inter 24px, weight 600 (semibold), line-height 32px, tracking -0.72px (-3%), color `var(--foreground)` (#1a1a1a). Should use **tabular figures** (`tabular-nums`). e.g. "5"
3. **Sub** — Caption/Small: Inter 12px, weight 400, line-height 16px, tracking -0.06px, color `var(--muted-foreground)`. e.g. "drafts + sent"

### Right: icon tile
- Square **36×36px** (`size-9`), radius **10px**, background `var(--muted)` (#f6f6f6), flex center
- Icon inside: **16×16px** (`size-4`)
- **Accent recolors the icon only** — tile bg and all text stay identical across variants. Icon color per accent: primary → `var(--primary)`, success/warning/destructive → the app's corresponding status tokens (e.g. `text-primary`, `text-emerald-600`/`--success`, `--warning`, `var(--destructive)`); use lucide icons matching semantics rather than exported vectors.

### Layout usage
- Used in a responsive KPI strip: grid **1 col → sm:2 → lg:4** (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)

### States
- None shown (static tile; no hover/focus variants in the design)

### Suggested Tailwind sketch
Card: `flex items-start justify-between rounded-[14px] border bg-card p-4`
Label: `text-xs font-medium text-muted-foreground`
Value: `text-2xl font-semibold leading-8 tracking-tight tabular-nums`
Sub: `text-xs text-muted-foreground`
Icon tile: `flex size-9 items-center justify-center rounded-[10px] bg-muted [&>svg]:size-4`

## Dev notes (verbatim from Figma)
"Dashboard metric tile: label · value · sub · accent icon. accent recolors the icon only (primary/success/warning/destructive). Used in the responsive KPI strip (1→sm:2→lg:4). Value uses tabular figures."

## Code target
components/stat-card.tsx (new shadcn/ui-style component; consumed by the dashboard KPI strip, e.g. app/(dashboard)/page.tsx)
