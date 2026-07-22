# Input / Text field (Figma node 40:2)

# Input / Text field

Structure: vertical stack, gap 4px — Label (optional, default on) → field → Helper (optional, default off). Component width in Figma: 240px.

## Sizes (field box only; label/helper excluded)
| Size | Height | Padding-x | Radius | Value text |
|---|---|---|---|---|
| Small | 32px | 10px | 8px | 14/20 (Body/Small), tracking -0.14px |
| Medium | 40px | 12px | 10px | 14/20 (Body/Small), tracking -0.14px |
| Large | 44px | 14px | 10px | 16/24 (Body/Medium), tracking -0.16px |

Field: flex row, items-center, gap 8px, 1px solid border, overflow clipped.

## Colors / states (all bound to shadcn vars)
- Default: bg `var(--background)` (#fff), border `var(--input)` (#e9e9e9), placeholder text `var(--muted-foreground)` (#4c4c4c)
- Focus: border `var(--ring)` (#2e5630), 1px (no extra ring shown); value text `var(--foreground)` (#1a1a1a)
- Filled: border `var(--input)`, value text `var(--foreground)`
- Error: border `var(--destructive)` (#c41c1c); helper text `var(--destructive)`
- Disabled: bg `var(--muted)` (#f6f6f6), border `var(--input)`, opacity 60% on field; helper also at opacity-60

## Typography
- Label: Caption/Medium — Inter Medium 12/16, tracking -0.06px, color `var(--foreground)`
- Value/placeholder: Inter Regular, per size table above; placeholder uses `var(--muted-foreground)`, entered value `var(--foreground)`
- Helper: Caption/Small — Inter Regular 12/16, tracking -0.06px, `var(--muted-foreground)` (destructive on error, dimmed on disabled)

## Icons
Optional leading and trailing icons, each 16x16px, boolean props, instance-swappable, gap 8px from text. Icon color follows muted/foreground text.

## shadcn/Tailwind mapping hints
- Small: `h-8 px-2.5 rounded-lg text-sm`
- Medium: `h-10 px-3 rounded-[10px] text-sm`
- Large: `h-11 px-3.5 rounded-[10px] text-base`
- Border: `border border-input bg-background`; focus: `focus-visible:border-ring` (design shows border color change only, no ring shadow); error: `aria-invalid:border-destructive`; disabled: `disabled:bg-muted disabled:opacity-60`
- Label: `text-xs font-medium leading-4 text-foreground`; Helper: `text-xs leading-4 text-muted-foreground`, error variant `text-destructive`
- Sizes intentionally match Button sizes (32/40/44)
- A11y: label clickable (htmlFor), helper wired via aria-describedby, error state keeps helper visible with destructive border + text

## Dev notes (verbatim from Figma)
"Single-line text entry. Sizes match Button: Small 32 / Medium 40 / Large 44 (field area only — label excluded). Label = Caption/Medium; value = Body/Medium on Large, Body/Small on Medium & Small; helper = Caption/Small (Show helper, default OFF) — muted-foreground normally, destructive on Error, dimmed on Disabled. Optional leading + trailing icons (boolean props, instance-swappable). States: default, focus, filled, error, disabled. A11y: label is clickable; helper is linked via aria-describedby; error keeps helper + border destructive."

## Code target
components/ui/input.tsx (plus a label/helper "field" wrapper, e.g. components/ui/form or field.tsx)
