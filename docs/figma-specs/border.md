# Border (Figma node 36:96)

## Border tokens (design-system spec section)

This section is a token reference sheet, not a component — it defines the border-width scale for the DS. Three swatches (96×48px, rounded-[10px], bg var(--card)) each labeled with a token name (11px Inter Regular, lh 14px, tracking -0.055px, color var(--foreground)) and a value line (same type, color var(--muted-foreground)).

### Border-width tokens
| Token | Width | Border color |
|---|---|---|
| `border-width/default` | 1px | `var(--border)` (#E9E9E9) |
| `border-width/2` | 2px | `var(--border)` (#E9E9E9) |
| `border-width/focus-ring` | 3px | `var(--ring)` (#2E5630) |

### Tailwind v4 / shadcn mapping
- Default borders on inputs, cards, dividers: `border border-border` (1px).
- Emphasized/selected borders: `border-2 border-border`.
- Focus ring: 3px in `--ring` color (JumboBee Primary/main green #2E5630). In shadcn/Tailwind v4 idiom: `focus-visible:ring-[3px] focus-visible:ring-ring` (or `border-3 border-ring` where a literal border is wanted, as drawn in the swatch).
- Swatch radius shown is 10px (`rounded-[10px]`), matching the DS control radius (`--radius` ≈ 10px) — but radius is documented elsewhere; the load-bearing values here are the three widths and the ring color binding.

### CSS vars referenced
- `--card` (#FFFFFF), `--border` (#E9E9E9), `--ring` (#2E5630), `--foreground` (#1A1A1A), `--muted-foreground` (#4C4C4C).

Layout of the sheet itself (only if reproducing the doc page): row `flex gap-4`, each item `flex flex-col gap-[6px] items-center`.

## Dev notes (verbatim from Figma)
Gray annotation text (values under each token label, verbatim): "1px" (under "border-width/default"), "2px" (under "border-width/2"), "3px" (under "border-width/focus-ring"). No other designer notes/Tailwind directives present in this node.

## Code target
app/globals.css (Tailwind v4 @theme / :root token definitions: --border, --ring); shared shadcn components using border/ring, e.g. components/ui/input.tsx, button.tsx (focus-visible:ring-[3px])
