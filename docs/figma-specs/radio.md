# Radio (Figma node 41:33)

## Radio — spec (Figma 41:33, variants 75:13–75:18)

Single circular radio control, 4 states (Unselected / Selected / Focus / Disabled).

### Base
- Size: **18×18px** fixed (`size-[18px]`), fully round (`rounded-full`, 999px)
- Background: `var(--background)` (white)
- Border: **1px solid**
- Content: flex, centered (dot centered)

### Dot (checked indicator)
- **8×8px** filled circle, colored with the primary color — in Figma it's an asset, but implement as an 8px circle filled `var(--primary)` (#2E5630)
- Shown in Selected and Disabled(-checked) states

### States
| State | Border | Dot | Other |
|---|---|---|---|
| Unselected | `var(--input)` (#E9E9E9) | none | — |
| Selected | `var(--primary)` (#2E5630) | 8px `var(--primary)` dot | — |
| Focus | `var(--ring)` (#2E5630) | none shown in Figma | focus ring color = ring token |
| Disabled | `var(--primary)` (#2E5630) | 8px dot | **opacity: 55%** (`opacity-55`) on whole control |

### shadcn/ui mapping (RadioGroupItem)
- `size-[18px] rounded-full border bg-background`
- unchecked border: `border-input`; checked: `data-[state=checked]:border-primary`
- indicator: `after:size-2 rounded-full bg-primary` (use RadioGroupIndicator with an 8px `fill-primary`/`bg-primary` circle instead of the default lucide Circle sizing)
- focus-visible: ring color `var(--ring)`
- disabled: `disabled:opacity-55` (note: 55%, not shadcn's default 50%)

### Section header typography (docs only, not the control)
- Title "Radio": Heading/H3 — Inter SemiBold 18/26, tracking -0.18px, `var(--foreground)` (#1A1A1A)
- Description: Caption/Small — Inter Regular 12/16, tracking -0.06px, `var(--muted-foreground)` (#4C4C4C)

## Dev notes (verbatim from Figma)
"Single choice from a small mutually-exclusive set (2–5). Circular; checked = primary ring + primary dot. Use Select for longer lists. A11y: arrow keys move within a group."

## Code target
components/ui/radio-group.tsx (shadcn/ui RadioGroup / RadioGroupItem)
