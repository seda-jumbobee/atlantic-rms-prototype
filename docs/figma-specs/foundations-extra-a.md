# Foundations extra A (Figma node 37:3)

**Section: Shadow scale (elevation tokens)**

Six named effect styles, Shadow/xs → Shadow/2xl. Values match Tailwind's default shadow scale exactly, so in Tailwind v4 these map 1:1 to the built-in `shadow-xs … shadow-2xl` utilities — no custom tokens needed unless you want explicit `--shadow-*` vars in `@theme`.

| Token | CSS box-shadow |
|---|---|
| Shadow/xs | `0 1px 2px 0 rgb(0 0 0 / 0.05)` |
| Shadow/sm | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` |
| Shadow/md | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` |
| Shadow/lg | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` |
| Shadow/xl | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` |
| Shadow/2xl | `0 25px 50px -12px rgb(0 0 0 / 0.25)` |

**Swatch presentation (if rebuilding the doc page):** wrapping flex row, `gap-[20px]`, wrap; each item = column, `gap-[8px]`, items-center. Card: 150×80px, `bg-[var(--card)]` (white), 1px solid `var(--border)` (#E9E9E9), `rounded-[12px]`, its shadow token applied. Label under card: Inter Regular 11px / 14px line-height, tracking -0.055px (-0.5%), color `var(--foreground)` (#1A1A1A), nowrap.

**Implementation notes**
- Use shadcn/Tailwind defaults: `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl` — the design's values are identical to Tailwind v4's defaults.
- Colors bound to vars in the design: `--card` (fallback white), `--border` (#e9e9e9), `--foreground` (#1a1a1a) — matches shadcn token names.
- No hover/focus/disabled states, sizes, or icons in this section; it is a foundations/elevation reference only.

## Dev notes (verbatim from Figma)
No annotation/dev-note text present in the node — only the token labels: "Shadow/xs", "Shadow/sm", "Shadow/md", "Shadow/lg", "Shadow/xl", "Shadow/2xl".

## Code target
app/globals.css (Tailwind v4 @theme shadow tokens); demo cards use var(--card)/var(--border)/var(--foreground)
