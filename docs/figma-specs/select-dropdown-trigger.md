# Select / Dropdown trigger (Figma node 40:56)

## Select / Dropdown trigger — spec

Component: 240px-wide demo column; label above trigger, gap 6px. Trigger opens a popover menu (see "Dropdown menu" section).

**Anatomy**
- Optional label: Caption/Medium — Inter 12px/16px, weight 500, tracking -0.06px, color `var(--foreground)` (#1a1a1a).
- Trigger "field": flex row, items-center, gap 8px, `rounded-[10px]`, overflow-clip, full width. Value text is flex-1; chevron-down icon 16x16 (`size-4`) right-aligned.

**Sizes** (match Button/Input sizes)
| Size | Height | pl / pr | Value typography |
|---|---|---|---|
| Small | 32px (h-8) | 10 / 8 | Body/Small: Inter 14/20 regular, tracking -0.14px |
| Medium | 40px (h-10) | 12 / 10 | Body/Small: 14/20 regular, tracking -0.14px |
| Large | 44px (h-11) | 14 / 12 | Body/Medium: Inter 16/24 regular, tracking -0.16px |

**States** (all sizes)
- Placeholder: bg `var(--background)` (white), 1px border `var(--input)` (#e9e9e9), text `var(--muted-foreground)` (#4c4c4c).
- Selected: same bg/border; text `var(--foreground)` (#1a1a1a).
- Focus: 2px border `var(--ring)` (#2e5630), white bg (no outer ring/shadow shown — border swaps 1px→2px).
- Disabled: bg `var(--muted)` (#f6f6f6), 1px border `var(--input)`, opacity 60%, placeholder-colored text.
- Error: 2px border `var(--destructive)` (#c41c1c), white bg, foreground text.

**Icon**: single chevron (down) vector, 16x16, same in all states (use lucide ChevronDown at size-4; color follows text/muted-foreground).

**shadcn/Tailwind mapping notes**
- SelectTrigger: `rounded-[10px] border-input bg-background gap-2 text-sm` with size variants `h-8 pl-2.5 pr-2`, `h-10 pl-3 pr-2.5`, `h-11 pl-3.5 pr-3 text-base`.
- Placeholder via `data-[placeholder]:text-muted-foreground`; focus = `focus-visible:border-ring focus-visible:border-2` (design shows thicker border, not ring); error = `aria-invalid:border-destructive aria-invalid:border-2`; disabled = `disabled:bg-muted disabled:opacity-60`.
- Label: `text-xs font-medium leading-4 text-foreground`, 6px gap to trigger.

## Dev notes (verbatim from Figma)
"Choose one from a list. Sizes match Button/Input: Small 32 / Medium 40 / Large 44. Label = Caption/Medium; value = Body/Medium on Large, Body/Small on Medium & Small. Opens a popover menu (see Dropdown menu). States: placeholder, selected, focus, disabled."

## Code target
components/ui/select.tsx (shadcn SelectTrigger; possibly label.tsx)
