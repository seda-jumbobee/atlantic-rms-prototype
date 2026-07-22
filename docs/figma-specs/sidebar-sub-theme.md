# Sidebar sub-theme (Figma node 34:35)

## Sidebar sub-theme (token swatch board, node 34:35)

This section is a **token documentation grid**, not a UI component: it defines the values for the shadcn `--sidebar-*` CSS variables in the JumboBee green theme. The actionable output for code is the token values below (set in `globals.css` under `:root` / `@theme inline`), likely consumed by `components/ui/sidebar.tsx`.

### Token values (light theme)
| CSS var | Hex |
|---|---|
| `--sidebar` | `#102A15` (Primary/dark green — sidebar bg is dark) |
| `--sidebar-foreground` | `#FAFAFA` |
| `--sidebar-primary` | `#4C7935` |
| `--sidebar-primary-foreground` | `#FAFAFA` |
| `--sidebar-accent` | `#405544` |
| `--sidebar-accent-foreground` | `#FAFAFA` |
| `--sidebar-border` | `#405544` |
| `--sidebar-ring` | `#4C7935` |

Note: the sidebar sub-theme is dark-on-dark (dark green surface `#102A15`, hover/active accent `#405544`, brand green `#4C7935` for primary/ring, near-white `#FAFAFA` text) even in light mode.

### Layout of the doc section itself (if reproducing the swatch page)
- Root: flex column, `gap-[12px]`.
- Section label "Sidebar sub-theme": Inter Medium 14/20, tracking -0.07px (Figma style Caption/Large), color `var(--muted-foreground)` (#4C4C4C).
- Swatch grid: `flex flex-wrap gap-[12px] w-full`.
- Each swatch cell: flex column, `w-[150px] gap-[6px]`:
  - Color chip: `h-[48px] w-full rounded-[8px] border border-[var(--border)]` (#E9E9E9), background = the token var.
  - Token name caption: Inter Regular 11px / line-height 14px, tracking -0.055px, color `var(--foreground)` (#1A1A1A).

No states, icons, or variants shown; no hover/focus specs in this node.

## Dev notes (verbatim from Figma)
No annotation/dev-note text present in this node beyond the token-name captions themselves (sidebar, sidebar-foreground, sidebar-primary, sidebar-primary-foreground, sidebar-accent, sidebar-accent-foreground, sidebar-border, sidebar-ring).

## Code target
app/globals.css (--sidebar-* variables) and components/ui/sidebar.tsx
