# Switch (Figma node 41:53)

## Switch — restyle spec (shadcn/ui Switch)

**Track**
- Size: 36×20px (`w-9 h-5`), fully rounded (`rounded-full`, Figma 999px)
- Off/unchecked: `bg-[var(--input)]` (#E9E9E9)
- On/checked: `bg-[var(--primary)]` (#2E5630)
- Focus: track stays `var(--input)` bg with a 2px solid `var(--ring)` (#2E5630) border directly on the track (not an offset ring — the Figma frame shows border-2 on the element itself; a standard shadcn `focus-visible:ring` treatment with ring color `var(--ring)` is an acceptable idiomatic equivalent)
- Disabled: `bg-[var(--primary)]` at **opacity 55%** and shown in the ON/checked position (knob at right)

**Thumb (knob)**
- 16×16px circle (`size-4`), white (rendered as an image asset in Figma; implement as a white `rounded-full` thumb, likely with a subtle shadow)
- Position: 2px inset top; off = left 2px, on = translated to left 18px (i.e. `translate-x-4` from a 2px base offset)

**States shown:** Off, On, Focus, Disabled (no hover variant in the design)

**Section heading typography (docs page, not the component):**
- Title "Switch": Heading/H3 — Inter Semi Bold 18px / 26px line-height, tracking -0.18px, color `var(--foreground)` (#1A1A1A)
- Description: Caption/Small — Inter Regular 12px / 16px, tracking -0.06px, color `var(--muted-foreground)` (#4C4C4C)

**Mapping to shadcn Switch defaults:** change `data-[state=checked]:bg-primary` (keep), `data-[state=unchecked]:bg-input` (keep), set root to `h-5 w-9`, thumb `size-4 bg-white data-[state=checked]:translate-x-4 translate-x-0` with 2px padding via thumb positioning; disabled: `disabled:opacity-55` (instead of shadcn's default 50).

## Dev notes (verbatim from Figma)
"Immediate on/off toggle for a setting (no save needed). On = primary track. For form submit choices use Checkbox instead. A11y: role=switch, label describes the setting."

## Code target
components/ui/switch.tsx
