# Status badge (Figma node 43:25)

## Status badge — single semantic status pill

One component, 5 variants: **neutral · info · positive · warning · negative**. Any domain-specific status (quote status, deal stage, source type, route step, invoice state) maps into one of these five.

### Container
- Inline flex, `items-center justify-center`, gap **5px**
- Padding: **8px horizontal, 2px vertical**
- Border-radius: **999px** (full pill)
- No border, no shadow

### Leading dot
- **6px × 6px** filled circle, colored per variant (dot color = variant fg color)

### Typography (label)
- Figma style **Caption/Medium**: Inter Medium, **12px / 16px line-height**, weight 500, letter-spacing **-0.06px** (-0.5%), `whitespace-nowrap`
- Tailwind: `text-xs font-medium leading-4`

### Variant colors (Figma exposes these as vars with hex fallbacks)
| Variant | bg | fg (text + dot) |
|---|---|---|
| Neutral | `var(--status-neutral-bg)` #F6F6F6 | `var(--status-neutral-fg)` #4C4C4C |
| Info | `var(--status-info-bg)` #E9EEE9 | `var(--status-info-fg)` #2E5630 |
| Positive | `var(--status-positive-bg)` #E3FBE3 | `var(--status-positive-fg)` #3F963F |
| Warning | `var(--status-warning-bg)` #FEF6ED | `var(--status-warning-fg)` #A66C29 |
| Negative | `var(--status-negative-bg)` #FCE4E4 | `var(--status-negative-fg)` #981111 |

shadcn mapping hints: neutral ≈ `bg-muted text-muted-foreground`; others need the dedicated `--status-*-bg/fg` token pairs added to the Tailwind v4 theme (info bg matches the JumboBee "Card/dark" green tint, info fg = primary green).

### shadcn/ui implementation
Restyle `Badge` (or a new `StatusBadge`) with a cva `status` variant prop (`neutral | info | positive | warning | negative`, default neutral); render the dot as `<span class="size-1.5 rounded-full bg-current" />` (uses text color) rather than an image asset. Classes: `inline-flex items-center gap-[5px] rounded-full px-2 py-0.5 text-xs font-medium leading-4 whitespace-nowrap`.

No hover/focus/disabled states shown (static, non-interactive chip). Default label text: "Status".

### Section header (docs only, not part of component)
Title uses Heading/H3 (Inter SemiBold 18/26, tracking -0.18px, `--foreground` #1A1A1A); description Caption/Small 12/16 in `--muted-foreground` #4C4C4C.

## Dev notes (verbatim from Figma)
"ONE semantic status scale for all state chips — replaces the separate QuoteStatus, DealStage, SourceType, route-step & invoice color maps found in code. Map any domain status to: neutral · info · positive · warning · negative."

## Code target
components/ui/badge.tsx (shadcn Badge) or a new components/ui/status-badge.tsx; replace per-domain color maps (QuoteStatus, DealStage, SourceType, route-step, invoice)
