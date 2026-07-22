# Segmented control / Toggle group (Figma node 41:74)

## Segmented control / Toggle group (shadcn ToggleGroup / Tabs restyle)

**Purpose:** switch between 2–4 mutually-exclusive views (Board/Table, Manager/Admin, All/Direct). Single-select only — for multi-select use standalone Toggles.

### Container (the group)
- `bg: var(--muted)` (#F6F6F6)
- padding: 3px all around, gap between segments: 2px
- radius: 10px, `overflow-clip`
- no border in the rendered examples (description mentions "bordered container" but styles show only the muted bg pill)
- hugs content (inline-flex), height derives from items (~36px total: 30px item + 2×3px pad)

### Segment item
- padding: 12px horizontal / 5px vertical → ~30px tall
- radius: 8px
- text: Inter Medium 14px / 20px line-height, letter-spacing -0.07px (named style **Caption/Large**)
- **Active:** `bg: var(--background)` (white), text `var(--foreground)` (#1A1A1A). "Raised surface" look — spec text says active = raised, so a subtle shadow (e.g. `shadow-sm`) is appropriate for the raised effect, though no explicit shadow value is in the extracted styles.
- **Inactive:** transparent bg, text `var(--muted-foreground)` (#4C4C4C)
- no icons shown; text-only segments, `whitespace-nowrap`

### Tailwind mapping (shadcn ToggleGroup)
- Group: `inline-flex gap-0.5 rounded-[10px] bg-muted p-[3px]`
- Item: `rounded-lg px-3 py-[5px] text-sm font-medium leading-5 tracking-[-0.07px] text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground whitespace-nowrap`
- (Equivalent to shadcn Tabs `TabsList/TabsTrigger` styling; use `data-[state=active]` if implemented via Tabs.)

### States
Only active/inactive shown in Figma; no explicit hover/focus/disabled variants in the section.

### Section header (docs only, not part of component)
- Title: Heading/H3 — Inter SemiBold 18/26, ls -0.18px, `var(--foreground)`
- Description: Caption/Small — Inter Regular 12/16, ls -0.06px, `var(--muted-foreground)`
- Example labels under each demo: Inter Regular 11/14, `var(--muted-foreground)`

## Dev notes (verbatim from Figma)
"Switch between 2–4 mutually-exclusive views (e.g. Board/Table, Manager/Admin). Active segment = raised surface; the bordered container groups them. For multi-select use standalone Toggles."

## Code target
components/ui/toggle-group.tsx (or components/ui/tabs.tsx TabsList/TabsTrigger)
