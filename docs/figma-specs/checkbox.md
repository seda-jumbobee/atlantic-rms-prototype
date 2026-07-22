# Checkbox (Figma node 41:2)

## Checkbox spec (Figma 41:2)

**Box**
- Size: 18x18px (`size-[18px]`, ~`size-4.5`)
- Radius: 4px (`rounded-[4px]`)
- Border: 1px solid

**States**
- Unchecked: bg `var(--background)` (#fff), border `var(--input)` (#E9E9E9)
- Checked: bg + border `var(--primary)` (#2E5630); centered check icon, 11x11px, white/primary-foreground stroke
- Indeterminate: same primary fill/border as checked; centered minus/dash icon, 11x11px
- Disabled (shown checked): same primary fill + check, whole control at `opacity-55`
- Error (per dev note, not drawn as variant): destructive border + error message below
- No distinct hover/focus states drawn — keep shadcn defaults (focus ring)

**Icons**
- Check and dash icons rendered at 11px inside flex-centered box (Lucide Check / Minus at ~11px, stroke = primary-foreground)

**Label/desc typography in section (context, not part of control)**
- Section title: Heading/H3 — Inter SemiBold 18/26, tracking -0.18px, color var(--foreground) (#1A1A1A)
- Description: Caption/Small — Inter Regular 12/16, tracking -0.06px, color var(--muted-foreground) (#4C4C4C)

**shadcn/Tailwind v4 restyle deltas vs default shadcn Checkbox**
- `size-4` → `size-[18px]`; `rounded-[4px]` (keep, or rounded-sm at 4px)
- checked: `data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground` (matches default)
- indeterminate: same primary treatment, Minus icon
- disabled: `disabled:opacity-55` instead of shadcn's default opacity-50 (Figma uses 55%)
- error/invalid: `aria-invalid:border-destructive` + destructive message text
- indicator icon size ~11px (`size-[11px]`, Lucide with strokeWidth default)
- Wrap with clickable `<label>`; ensure >=24px hit area (e.g. padding on label or min-h-6 wrapper)

## Dev notes (verbatim from Figma)
"Multi-select / boolean opt-in. 18px box, radius 4. Checked = primary fill + check. Supports indeterminate (parent of mixed children). Error via destructive border + message. A11y: label is clickable; 24px+ hit area."

## Code target
components/ui/checkbox.tsx (shadcn Checkbox)
