# Status scale (Figma node 34:2)

## Status scale (unified — replaces the 5 hardcoded badge maps)

This section is a **token swatch board**, not a component: it defines a unified 5-tier status color scale meant to replace the app's 5 separate hardcoded badge color maps. Implement as CSS custom properties (Tailwind v4 `@theme` / `:root`) and refactor all status-badge logic to a single map keyed by semantic status.

### Tokens (name → hex, all defined as `var(--…)` in the design)

| Token | Value |
|---|---|
| `--status-info-bg` | `#E9EEE9` |
| `--status-info-fg` | `#2E5630` |
| `--status-positive-bg` | `#E3FBE3` |
| `--status-positive-fg` | `#3F963F` |
| `--status-warning-bg` | `#FEF6ED` |
| `--status-warning-fg` | `#A66C29` |
| `--status-negative-bg` | `#FCE4E4` |
| `--status-negative-fg` | `#981111` |
| `--status-neutral-bg` | `#F6F6F6` |
| `--status-neutral-fg` | `#4C4C4C` |

5 variants: **info, positive, warning, negative, neutral** — each a bg (soft tint) + fg (text/icon) pair. Note info reuses brand greens (fg = existing `--primary` #2E5630); neutral fg matches `--muted-foreground` #4C4C4C.

### Suggested implementation
- Add tokens to `globals.css` `@theme` block so utilities like `bg-status-warning-bg` / `text-status-warning-fg` exist, or use arbitrary `bg-[var(--status-warning-bg)]`.
- Consolidate into one Badge variant map (e.g. shadcn `badgeVariants` via cva): `{ info | positive | warning | negative | neutral }` → `bg-(--status-X-bg) text-(--status-X-fg)`, replacing the 5 per-page hardcoded maps.
- Swatch tiles themselves (if reproducing the doc page): 150px wide, 48px tall, `rounded-[8px]`, 1px border `var(--border)` #E9E9E9; label below in Inter 11px/14px normal, `var(--foreground)` #1A1A1A; grid is flex-wrap gap-12px.
- Section heading text style: Caption/Large — Inter Medium 14px / 20px line-height, letter-spacing -0.5%, color `var(--muted-foreground)` #4C4C4C.

No hover/focus/disabled states or icons are shown in this section.

## Dev notes (verbatim from Figma)
Section title (gray, Caption/Large): "Status scale (unified — replaces the 5 hardcoded badge maps)". Swatch labels: status-info-bg, status-info-fg, status-positive-bg, status-positive-fg, status-warning-bg, status-warning-fg, status-negative-bg, status-negative-fg, status-neutral-bg, status-neutral-fg.

## Code target
app/globals.css (token definitions) + shared badge/status component, e.g. components/ui/badge.tsx or a StatusBadge wrapper replacing the 5 per-page hardcoded badge color maps
