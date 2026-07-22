# KPI stat strip (Figma node 55:20)

## KPI stat strip (StatCard grid)

**Structure:** A row/grid of identical `StatCard` components (component instances, node 87:149 "StatStrip"). Each card: horizontal flex, `justify-between items-start`, left = text stack, right = icon tile.

### StatCard
- Container: `bg-[var(--card)]`, `border border-[var(--border)]` (#E9E9E9), `rounded-[14px]`, `p-4` (16px), `flex-1 min-w-0`, gap between cards `12px` (gap-3)
- Text stack: `flex flex-col gap-1` (4px), nowrap
  - Label (top): Caption/Medium — Inter 12px, font-medium (500), leading-4 (16px), tracking -0.06px, `text-[var(--muted-foreground)]` (#4C4C4C). e.g. "Open quotes"
  - Value: Heading/H1 — Inter 24px, font-semibold (600), leading-8 (32px), tracking -0.72px, `text-[var(--foreground)]` (#1A1A1A). e.g. "5", "$28,200"
  - Sub-caption (bottom): Caption/Small — Inter 12px, font-normal (400), leading-4, tracking -0.06px, `text-[var(--muted-foreground)]`. e.g. "drafts + sent", "this month"
- Icon tile (right): `size-9` (36×36), `bg-[var(--muted)]` (#F6F6F6), `rounded-[10px]`, flex center; icon inside is 16×16 (`size-4`), lucide-style line icon, muted-foreground color

### Layout / responsive (per designer note)
Cards live in a responsive grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3` (reports pages use 5 columns). Desktop mock shows 4-up at 1272px total width.

### Tokens used
- `var(--card)` white, `var(--border)` #E9E9E9, `var(--muted)` #F6F6F6, `var(--muted-foreground)` #4C4C4C, `var(--foreground)` #1A1A1A

### States / icons
No hover/focus/disabled states shown. Icons: one 16px monochrome vector per card (asset URLs expire; use lucide equivalents like FileText, Handshake, DollarSign, Plug).

### Example content (4 cards)
1. Open quotes / 5 / drafts + sent
2. Active deals / 4 / in pipeline
3. Won / $28,200 / this month
4. Rate sources / 11 / APIs · contracts

## Dev notes (verbatim from Figma)
"The most repeated layout: StatCards in a responsive grid — 1-up (mobile) → sm:2-up → lg:4-up (reports use 5). Leads dashboards & every admin page."

## Code target
Likely a StatCard/KPI component in /Users/sedaghukasyan/Desktop/atlantic-rms-prototype-main/app (e.g. components/stat-card.tsx or dashboard page KPI row)
