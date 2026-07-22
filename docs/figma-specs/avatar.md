# Avatar (Figma node 44:2)

## Avatar (node 44:2)

Circular avatar, monogram (initials) fallback on solid color, optional status dot. Fully round: `rounded-full` (999px).

### Sizes (3 variants)
| Size | Diameter | Initials type | Tailwind |
|---|---|---|---|
| sm | 24px (`size-6`) | Inter Regular 11px / lh 14px / tracking -0.055px | `text-[11px] font-normal leading-[14px]` |
| default (md) | 32px (`size-8`) | Caption/Medium: Inter Medium 12px / lh 16px / tracking -0.06px | `text-xs font-medium` |
| lg | 40px (`size-10`) | Caption/Large: Inter Medium 14px / lh 20px / tracking -0.07px | `text-sm font-medium` |

### Colors
- Fallback background: `var(--primary)` (#2E5630)
- Initials text: `var(--primary-foreground)` (#FAFAFA)
- Content centered (flex items-center justify-center)
- No border shown.

### Status dot (optional boolean)
Absolutely positioned at bottom-right, 30% of avatar diameter, positioned at 70% left/top:
- sm: 7.2px dot at left/top 16.8px
- md: 9.6px dot at left/top 22.4px
- lg: 12px dot at left/top 28px
Implement as `absolute` child sized `size-[30%]` at `left-[70%] top-[70%]` (or bottom-right-0 with translate). Dot rendered as image asset in Figma (exact fill not in variables); by DS convention likely a green (Primary/light-ish) filled circle with white/background ring — verify color from asset if needed. Suggested: `rounded-full bg-emerald-500 ring-2 ring-background` (ring scaled ~1-2px per size).

### shadcn adaptation notes
- Add a `size` variant prop (sm/default/lg) to shadcn Avatar via cva: `size-6`/`size-8`/`size-10`.
- AvatarFallback: `bg-primary text-primary-foreground` with per-size text classes above (sm uses 11px regular, md/lg medium weight).
- Optional `statusDot` prop rendering the positioned dot span.
- Group usage per dev note: overlapping avatars (negative margin) + trailing "+N" count avatar.
- A11y: provide `alt` on AvatarImage / `aria-label` with the person's name.

### Named text styles referenced
- Caption/Medium (12/16 Medium) — md initials
- Caption/Large (14/20 Medium) — lg initials
- Section heading uses Heading/H3 (18/26 SemiBold) and Caption/Small (12/16 Regular) for the description text (not part of the component).

## Dev notes (verbatim from Figma)
"User/entity identity. Sizes sm 24 / default 32 / lg 40. Monogram fallback on data color when no image; optional status dot; group = overlap + count. A11y: alt/aria-label with the person's name."

## Code target
components/ui/avatar.tsx (shadcn Avatar)
