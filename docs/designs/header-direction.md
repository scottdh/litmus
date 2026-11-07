# Design: the header

Decided. Method: four directions built in place behind a picker (`emil-prototype`), judged against the real map so dimming could be tried, with `emil-design-foundations`, `emil-typography`, `emil-touch-and-accessibility` and `emil-ui-polish` loaded. Scott picked One bar.

## 1. Goals

The header spent about 120 px of every visit on things people stop reading once they've learnt them: the definition of green, and five filled light chips. The lights are meant to be easy to remember, so a permanent legend turns into furniture. The goal was to keep the key one step away for the people still learning it, and give the room back to the story.

What must stay: the chips are also the filter that dims the map to one light, so that stays one click from the key, and a dimmed map must say so where you can see it. The sample notice must stay reachable, because changes to sample data are lost on restart.

## 2. Critique of what was there

- **Aesthetic and minimalist design.** Five saturated chips were the loudest thing on the page, louder than any light on the map they explain.
- **Hierarchy.** The 22 px sans title sat under 28 px serif chapter headings, so neither was clearly in charge.
- **Recognition over recall** was over-served: the key was permanent for a fact people learn in a day.

## 3. Options

1. **One bar (chosen).** Title, status and buttons share one hairline row. A Key button opens a popover with each light, its meaning, the definition of green and the sample notice. Picking a light dims the map and puts a chip in the row. It gives back the most room and lets the chapters be the headline. Cost: a new user has to find Key.
2. **Masthead.** Title in the story face at 40 px, and the key shrunk to five bare marks that explain themselves in a tooltip. Rejected: the title took as much height as before, and unlabelled marks only work once you already know them, which is the problem in reverse.
3. **Learn, then fold.** A full "How to read the map" card on the first visit, folding into a quiet row once dismissed. Rejected: two states to maintain, a taller first visit than before, and a fold kept in browser storage means every new browser starts over.
4. **What was there.** Kept as the baseline in the picker.

## 4. The design

One row at the top of the page, ruled below with `line` at `--hairline`, 12 px under it to the story.

- **Title:** the map name, sans 15 px semibold, balanced. Beside it, when the data is invented, a **Sample** tag: 12 px on `light-grey`.
- **Status:** the existing live line, 13 px `muted`, filling the space between.
- **Buttons, right-aligned:** when the map is dimmed, a chip filled with that light reading "Yellow only ×", which clears the dim. Then **Key**, with three small marks before the word so it reads as a key at a glance. Then Undo, Show the whole story, and Expand all as before.
- **Key popover:** 22 rem wide, or the screen less 2 rem, under Key and aligned to its end, `surface` with `shadow-raised`. Title "What the lights mean". One row per light: its chip and its meaning, as a toggle that dims the map. Then the definition of green, "Pick a light to dim the rest of the map.", and the full sample notice in a `light-grey` box. It fades in with opacity over 150 ms, closes on Esc or a click outside, and returns focus to Key.

At 375 px the row wraps: title and tag, then the buttons. The popover keeps a 16 px gutter. It hides behind the drawer on a phone, as the old header did.

## 5. States

- **Dimmed:** the chip shows in the row, and the matching popover row is pressed.
- **Real data:** no tag, and no sample notice in the popover.
- **Status empty:** the line takes no height, and the row stays 48 px.

## 6. What it needs from outside

Nothing.

## 7. Build split

One PR (#34): `apps/web/src/ui/popover.tsx`, `apps/web/src/features/map/key-popover.tsx`, `apps/web/src/features/map/story-wall.tsx`, `DESIGN.md`. No logic changes, so no new tests.

## 8. Questions for Scott

None open.
