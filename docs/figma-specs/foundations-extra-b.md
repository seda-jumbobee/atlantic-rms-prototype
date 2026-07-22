# Foundations extra B (Figma node 37:23)

**What it is:** Side-by-side Light/Dark theme demo of a "Quote" card (QuoteCard pattern) proving token mappings — two labeled swatch panels, each containing the same card.

**Layout (demo wrapper, not for implementation):** row, gap 20px; each panel flex-1, padding 20px, radius 14px, gap 12px, 1px border var(--border), bg var(--background); panel label "Light"/"Dark" in Caption/Medium 12/16 500, color var(--muted-foreground).

**Card component (the implementable piece):**
- Container: bg `var(--card)`, border 1px solid `var(--border)`, radius 12px (`rounded-xl`), padding 16px (`p-4`), flex-col, gap 10px, w-full.
- Title "Quote Q-190612": Heading/H4 (Card title) — Inter Medium 16px/24px, tracking -0.16px → `text-base font-medium leading-6`, color `var(--card-foreground)`.
- Subtitle "Charleston, IL → Shanghai, China": Caption/Small — Inter Regular 12px/16px, tracking -0.06px → `text-xs leading-4`, color `var(--muted-foreground)`.
- Footer row: flex items-center gap 8px, spacer flex-1 between badge and button.
- Status badge "Confirmed": pill radius 999px (`rounded-full`), px 8 / py 2, bg `var(--status-positive-bg)` (#e3fbe3), text `var(--status-positive-fg)` (#3f963f), Caption/Medium 12/16 500. Same values in both themes (status colors are not theme-swapped here).
- Button "Open": bg `var(--primary)`, text `var(--primary-foreground)`, px 12 / py 8 (→ 32px tall), radius 10px, text 12px/16px font-medium, justify-center.

**Token values per theme (map to shadcn vars):**
| Token | Light | Dark |
|---|---|---|
| --background | #FFFFFF | #0B1F10 |
| --card | #FFFFFF | #102A15 |
| --card-foreground | #1A1A1A | #FAFAFA |
| --muted-foreground | #4C4C4C | #CCCCCC |
| --border | #E9E9E9 | #405544 |
| --primary | #2E5630 | #4C7935 |
| --primary-foreground | #FAFAFA | #FFFFFF |
| --status-positive-bg | #E3FBE3 | #E3FBE3 |
| --status-positive-fg | #3F963F | #3F963F |

Note: --status-positive-bg/fg are not standard shadcn tokens — add them as custom vars (or map to a Badge "success" variant).

**Named text styles:** Caption/Medium (Inter 12/16 500, ls -0.5), Caption/Small (Inter 12/16 400, ls -0.5), Heading/H4 Card title (Inter 16/24 500, ls -1).

**States/icons:** none shown (static demo, no hover/focus specs, no icons/images).

## Dev notes (verbatim from Figma)
No dev-note annotations present in this section. The only small gray texts are the panel labels "Light" and "Dark" (Caption/Medium, var(--muted-foreground)).

## Code target
Likely a QuoteCard component (per memory: QuoteCard/CalcRow in the RMS home rebuild) — e.g. components/quote-card.tsx plus theme tokens in app/globals.css (:root and .dark blocks)
