# Atlantic RMS ↔ Figma design system map

**Figma file:** `RMS New` — key `efgMLVK7m16t9Ey3ReIDCl`, page "Ui kit" (`32:68`).
Every token and component in this codebase mirrors that file 1:1. When a request names a Figma component ("the Status badge", "the KPI tile"), resolve it through the tables below.

## Tokens (`app/globals.css`)

### Colors — Figma "Color" collection (Light / Dark)

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--background` | `#ffffff` | `#0b1f10` | |
| `--foreground` | `#1a1a1a` | `#fafafa` | |
| `--card` / `--popover` | `#ffffff` | `#102a15` | dark popover derived (=card) |
| `--primary` | `#2e5630` | `#4c7935` | JumboBee green |
| `--primary-foreground` | `#fafafa` | `#ffffff` | |
| `--secondary` / `--muted` | `#f6f6f6` | `#1a3320` / `#16301c` (derived) | |
| `--muted-foreground` | `#4c4c4c` | `#cccccc` | |
| `--accent` | `#e9eee9` | `#405544` (derived) | soft green tint |
| `--accent-foreground` | `#102a15` | `#fafafa` | |
| `--destructive` | `#c41c1c` | `#e05252` (derived) | fg `#fafafa` |
| `--success` | `#51bc51` | same | fg `#102a15` |
| `--warning` | `#f09731` | same | fg `#102a15` |
| `--border` / `--input` | `#e9e9e9` | `#405544` | |
| `--ring` | `#2e5630` | `#4c7935` | |
| `--chart-1…5` | `#2e5630 #8faa5d #f09731 #51bc51 #4c7935` | brand-hued (see file) | never gray in dark |
| `--sidebar*` | `#102a15` bg · `#4c7935` primary · `#405544` accent/border · `#fafafa` fg | same | theme-stable dark green |

### Status scale — Figma "Status scale" (`34:2`) — THE only palette for state chips

| Tone | bg | fg | Typical mapping |
|---|---|---|---|
| `neutral` | `#f6f6f6` | `#4c4c4c` | draft, offline tariff, archived |
| `info` | `#e9eee9` | `#2e5630` | sent, qualification, spot |
| `positive` | `#e3fbe3` | `#3f963f` | confirmed, won, contract, active |
| `warning` | `#fef6ed` | `#a66c29` | negotiation, expired, pending review |
| `negative` | `#fce4e4` | `#981111` | lost, failed, overdue |

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
| Stepper | `56:28` | quote-master wizard steps ([components/quote/quote-master.tsx](components/quote/quote-master.tsx)) |
| Icons | `73:33` | lucide-react, `size-4` default |

## Rules
1. Token-first — no hardcoded hex/palette classes in components.
2. One status scale — all state chips via StatusBadge tones.
3. `text-[10px]`/`text-[11px]` → `text-caption`.
4. One primary button per view; destructive style only for irreversible actions.
5. Icon-only controls need `aria-label`; min target 32px.

Extraction specs (per-section detail dumps) archived from the Figma file on 2026-07-21.
