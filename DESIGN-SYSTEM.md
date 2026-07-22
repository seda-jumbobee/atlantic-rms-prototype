# Atlantic RMS ↔ Figma design system map

**Figma file:** `RMS New` — key `efgMLVK7m16t9Ey3ReIDCl`, page "Ui kit" (`32:68`).
Every token and component in this codebase mirrors that file 1:1. When a request names a Figma component ("the Status badge", "the KPI tile"), resolve it through the tables below.

## Tokens (`app/globals.css`)

### Colors — Figma "Color" collection (Light / Dark), aliasing "Brand Primitives"

Brand palette (2026-07-22 reference board): **brand/primary = indigo ramp** (default `#282aab` · light `#4a4fcf` · dark/hover `#20248f` · active `#14166d` · disabled `#f3f3f8`), **brand/secondary = orange ramp** (default `#ff4c00` · light `#ff7033` · dark `#cc3f00` · hover `#e64500` · active `#b53800` · disabled `#ffe4d9`).

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--background` | `#fafafa` | `#121212` | background/page · neutral/black |
| `--card` / `--popover` | `#ffffff` | `#1e1e1e` (derived) | background/surface |
| `--foreground` | `#121212` | `#fafafa` | text/primary |
| `--primary` (+`-hover/-active/-disabled`) | `#282aab` (`#20248f`/`#14166d`/`#f3f3f8`) | `#4a4fcf` (ramp shifted) | brand/primary; also `--ring`, links |
| `--brand-secondary` (+states) | `#ff4c00` (hover `#e64500`, active `#b53800`, disabled `#ffe4d9`) | `#ff7033` | orange; Button variant `brand-secondary` |
| `--secondary` / `--muted` | `#f6f6f6` | `#242424`/`#1e1e1e` (derived) | neutral/gray-50 — shadcn subtle surface, NOT the orange |
| `--muted-foreground` | `#4f4f4f` | `#cccccc` | text/secondary · gray-300 |
| `--accent` | `#f3f3f8` | `#20248f` | light-indigo tint — menu hover/selection |
| `--accent-foreground` | `#14166d` | `#ffffff` | |
| `--destructive` | `#d32f2f` | same | feedback/danger/default = text/error; fg white |
| `--success` | `#388e3c` | same | fg white |
| `--warning` | `#ffa000` | same | fg `#121212` (white on amber fails contrast) |
| `--border` / `--input` | `#e9e9e9` | `#4f4f4f` | border/light · border/dark |
| `--chart-1…5` | `#282aab #ff4c00 #ffa000 #388e3c #4a4fcf` | dark variants in file | indigo/orange/amber/green |
| `--sidebar*` | bg = `sidebar-border` (`#20248f`) · hover = `status-info-fg` (`#282aab`, lighter) · **active `#4a4fcf`** (lightest) · badge `#cc3f00` · fg `#fafafa` · ring `#fafafa` | same | rest < hover < active; theme-stable |

Reference-board quirks (resolved, documented in `globals.css`): `text/link` printed hex `BDBDBD` is a typo (swatch is indigo) → links use brand/primary; `border/dark` printed hex `CCCCCC` contradicts its dark swatch → `#4f4f4f`; `--status-warning-fg #8a5300` is the one derived color (reference amber `#ff8f00` reads 1.9:1 on its light tint).

### Status scale — Figma "Status scale" (`34:2`) — THE only palette for state chips

| Tone | bg | fg | Typical mapping |
|---|---|---|---|
| `neutral` | `#f6f6f6` | `#4f4f4f` | draft, offline tariff, archived |
| `info` | `#f3f3f8` | `#282aab` | sent, qualification, spot |
| `positive` | `#c8e6c9` | `#2e7d32` | confirmed, won, contract, active |
| `warning` | `#ffecb3` | `#8a5300` | negotiation, expired, pending review |
| `negative` | `#ffcdd2` | `#c62828` | lost, failed, overdue |

Theme-stable (same values in dark). Use `<StatusBadge tone="…">` ([components/status-badge.tsx](components/status-badge.tsx)) or `<Badge variant="status-…">`. Never raw amber/emerald/slate.

### Typography — Figma "Typography" (`35:2`) — Inter, 13 styles

| Figma style | Spec | Tailwind |
|---|---|---|
| Heading/H1 | 24/32 SemiBold −3% | `text-2xl font-semibold tracking-tight` |
| Heading/H2 | 20/28 SemiBold −2% | `text-xl font-semibold tracking-tight` |
| Heading/H3 | 18/26 SemiBold −1% | `text-lg font-semibold` |
| Heading/H4 (Card title) | 16/24 Medium −1% | `text-base font-medium` (=CardTitle) |
| Body/Large · Medium · Small | 18/28 · 16/24 · 14/20 Regular | `text-lg` · `text-base` · `text-sm` (default body) |
| Button/Large · Medium | 16/24 · 14/20 Medium | Button `lg` · `default` |
| Caption/Large | 14/20 Medium | `<Label>` / field captions |
| Caption/Medium · Small | 12/16 Medium · Regular | `text-xs font-medium` · `text-xs` |
| Caption | 11/14 Regular | `text-caption` (custom token) |

Mono (IDs, contract refs): `font-mono text-xs` (Geist Mono). Body carries global `letter-spacing:-0.01em`.

### Radius — Figma "Radius" (`36:57`)
`--radius: 10px` base → `rounded-sm` 6 · `rounded-md` 8 · `rounded-lg` 10 · `rounded-xl` 14 (cards) · `rounded-2xl` 18 · `rounded-full` pills.

### Spacing / breakpoints / shadows
Tailwind defaults; sanctioned spacing steps 0–6, 8, 10, 12, 16, 20, 24 (×4px). Breakpoints sm 640 / md 768 / lg 1024 / xl 1280. Shadows = Tailwind `shadow-xs…2xl` (Figma Shadow/* matches exactly). Focus ring: `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`. Border default 1px.

## Components — Figma section (node) → code

| Figma component | Node | Code |
|---|---|---|
| Button | `38:6` | [components/ui/button.tsx](components/ui/button.tsx) — sm h-8 / default h-10 / lg h-11; destructive is SOFT (tinted bg) |
| Input / Text field | `40:2` | [ui/input.tsx](components/ui/input.tsx), [ui/input-group.tsx](components/ui/input-group.tsx) |
| Textarea | `40:41` | [ui/textarea.tsx](components/ui/textarea.tsx) |
| Select / Dropdown trigger | `40:56` | [ui/select.tsx](components/ui/select.tsx) |
| Checkbox / Radio / Switch | `41:2` / `41:33` / `41:53` | [ui/checkbox.tsx](components/ui/checkbox.tsx) / [ui/radio-group.tsx](components/ui/radio-group.tsx) / [ui/switch.tsx](components/ui/switch.tsx) |
| Segmented control | `41:74` | [ui/toggle-group.tsx](components/ui/toggle-group.tsx), [ui/toggle.tsx](components/ui/toggle.tsx) |
| Dropdown menu | `42:2` | [ui/dropdown-menu.tsx](components/ui/dropdown-menu.tsx) |
| Badge | `43:6` | [ui/badge.tsx](components/ui/badge.tsx) — pill, +5 `status-*` variants |
| **Status badge** | `43:25` | [components/status-badge.tsx](components/status-badge.tsx) — `StatusBadge` + Quote/DealStage/Source wrappers |
| Avatar | `44:2` | [ui/avatar.tsx](components/ui/avatar.tsx), [deals/manager-avatar.tsx](components/deals/manager-avatar.tsx) |
| StatCard (KPI tile) | `44:44` | [components/stat-card.tsx](components/stat-card.tsx) |
| Card | `45:2` | [ui/card.tsx](components/ui/card.tsx) — rounded-xl (14px) |
| Tabs | `45:31` | [ui/tabs.tsx](components/ui/tabs.tsx) |
| Table | `46:2` | [ui/table.tsx](components/ui/table.tsx) |
| Pagination | `46:52` | [ui/pagination.tsx](components/ui/pagination.tsx) |
| Breadcrumb | `47:2` | [ui/breadcrumb.tsx](components/ui/breadcrumb.tsx) |
| Tooltip | `47:17` | [ui/tooltip.tsx](components/ui/tooltip.tsx) |
| Sidebar nav item | `47:36` | [components/app-sidebar.tsx](components/app-sidebar.tsx) (machinery: ui/sidebar.tsx) |
| Alert | `48:6` | [ui/alert.tsx](components/ui/alert.tsx) |
| Toast | `48:42` | [ui/sonner.tsx](components/ui/sonner.tsx) |
| Dialog / Modal | `49:2` | [ui/dialog.tsx](components/ui/dialog.tsx), [ui/alert-dialog.tsx](components/ui/alert-dialog.tsx) |
| Empty state | `49:22` | [components/empty-state.tsx](components/empty-state.tsx) |
| Skeleton / Spinner / Progress | `50:2` / `50:15` / `50:35` | [ui/skeleton.tsx](components/ui/skeleton.tsx) / [ui/spinner.tsx](components/ui/spinner.tsx) / [ui/progress.tsx](components/ui/progress.tsx) |
| Page header | `55:6` | [components/page-header.tsx](components/page-header.tsx) |
| KPI stat strip / Icon tile | `55:20` / `55:63` | pattern of StatCard — see [components/stat-card.tsx](components/stat-card.tsx) |
| Filter toolbar & list header | `56:2` | pattern — admin pages' toolbars |
| Stepper | `56:28` | Rate Quote wizard steps ([components/quote/quote-master.tsx](components/quote/quote-master.tsx)) |

> **User-facing naming (2026-07-22):** "Quote Master" → **Rate Quote**, "Route Builder" → **Custom Route**. Internal route paths (`/quote-master`, `/route-builder`), file names, and code identifiers are unchanged by design. |
| Icons | `73:33` | lucide-react, `size-4` default |

## Rules
1. Token-first — no hardcoded hex/palette classes in components.
2. One status scale — all state chips via StatusBadge tones.
3. `text-[10px]`/`text-[11px]` → `text-caption`.
4. One primary button per view; destructive style only for irreversible actions.
5. Icon-only controls need `aria-label`; min target 32px.

Extraction specs (per-section detail dumps) archived from the Figma file on 2026-07-21.
