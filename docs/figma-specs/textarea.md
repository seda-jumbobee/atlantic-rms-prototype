# Textarea (Figma node 40:41)

## Textarea — spec

Component: label + multi-line field (states: Default, Focus, Error, Disabled). Container: flex-col, gap 6px, width 240px in Figma (fluid in code).

### Label (optional — "Show label" toggle)
- Text style Caption/Medium: Inter 12px, weight 500, line-height 16px, tracking -0.06px
- Color: var(--foreground) (#1a1a1a)

### Field (all states)
- Min height 72px (auto-grows in code), padding: 12px x / 8px y
- Radius: 10px (rounded-[10px])
- Value text — Body/Small: Inter 14px, weight 400, line-height 20px, tracking -0.14px

### States
| State | bg | border | text |
|---|---|---|---|
| Default | var(--background) #fff | 1px var(--input) #e9e9e9 | placeholder/value var(--muted-foreground) #4c4c4c |
| Focus | var(--background) | 2px var(--ring) #2e5630 | var(--foreground) #1a1a1a |
| Error | var(--background) | 2px var(--destructive) #c41c1c | var(--muted-foreground) |
| Disabled | var(--muted) #f6f6f6 | 1px var(--input) | var(--muted-foreground), whole field opacity 60% |

### Tailwind mapping (shadcn textarea)
- Base: `min-h-[72px] rounded-[10px] px-3 py-2 text-sm leading-5 border border-input bg-background placeholder:text-muted-foreground`
- Focus: `focus-visible:border-ring focus-visible:border-2` (design uses 2px ring-color border, not outline ring)
- Error (aria-invalid): `border-2 border-destructive`
- Disabled: `disabled:bg-muted disabled:opacity-60`
- Label: `text-xs font-medium leading-4 text-foreground`, gap-1.5 (6px) between label and field

No icons. Border/focus/error tokens intentionally match the Input component.

## Dev notes (verbatim from Figma)
Multi-line entry (auto-grows in code). Label = Caption/Medium (Show label toggle); value = Body/Small; same border/focus/error tokens as Input; min height 72px.

## Code target
components/ui/textarea.tsx (shadcn/ui Textarea)
