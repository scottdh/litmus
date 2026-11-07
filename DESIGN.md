# DESIGN.md

Describes what exists, so don't document things that don't. See `docs/agents/skills.md` for which skill to use when, and `docs/designs/wall-direction.md` for why the map looks as it does.

The character: quiet, reading-first, editorial. Colour is small and means something. Nothing is decorated.

## Tokens

All tokens live in `apps/web/src/app/globals.css`. Lint rejects hardcoded colours in components. Themes flip the variables, so never write `dark:` for colour.

| Use                                          | Token                                                     |
| -------------------------------------------- | --------------------------------------------------------- |
| Page, raised surface                         | `canvas`, `surface`                                       |
| Text, secondary text                         | `ink`, `muted`                                            |
| Dividers                                     | `line`, at `--hairline` width                             |
| A light drawn on the page, as a mark or bar  | `mark-green`, `mark-yellow`, `mark-red`, `mark-grey`      |
| A control filled with a light, with its text | `light-*` with `on-light-*`                               |
| A control that removes something             | `danger` as text, never as a fill                         |
| Out of scope                                 | The `hatch` utility with `muted` text                     |
| Elevation                                    | `shadow-raised`, which becomes a single ring in dark mode |

Every `on-light-*` is at least 4.5:1 on its fill. Every `mark-*` is at least 3:1 on `canvas` and `surface`, and `danger` at least 4.5:1. Recheck if you change any of them. `danger` stays text on the quiet button, because a red fill would read as a red light, like the "Red only" chip.

## Type

Two faces, set in `apps/web/src/app/layout.tsx`. Use nothing else.

| Role                | Style                                                |
| ------------------- | ---------------------------------------------------- |
| Chapter heading     | `font-story`, 28 px, line height 1.1, slightly tight |
| Chapter on a rail   | `font-story`, 17 px, line height 1.2, `muted`        |
| Page title          | Sans, 15 px, semibold                                |
| Task                | Sans, 15 px, line height 1.35                        |
| Subtask             | Sans, 14 px, `muted`                                 |
| Step                | Sans, 13 px, `muted`                                 |
| Labels and captions | Sans, 13 px                                          |
| Counts              | 12 px or 13 px, always `tabular-nums`                |

Names are never truncated in the Story view.

## Motion

Hover and press take 150 ms `ease-out`; list the properties, because lint bans `transition-all`. Press scales to 0.96. Panels fade in with opacity and never animate height. The drawer is the exception: it slides in from the right with `--motion-focus`. Chapter focus uses `--motion-focus`, 240 ms. It's the one place a width animates, which is allowed because task text sits in a fixed-width box and nothing reflows. `globals.css` handles reduced motion.

## Components

Shared components live in `apps/web/src/ui` and are the only place that imports Base UI. Product components live in `apps/web/src/features/map`.

### Header

`apps/web/src/features/map/story-wall.tsx`. One hairline-ruled row: the map name, a Sample tag when the data is invented, the live status line, then the buttons. The lights aren't explained on the page, because people learn them quickly. When the map is dimmed to one light, a chip filled with that light says so and clears it. Picked teams and picked personas each get a chip in the same way. `docs/designs/header-direction.md` has the reasoning.

### KeyPopover

`apps/web/src/features/map/key-popover.tsx`. Where the lights are explained: each light and its meaning, the definition of green, and the sample notice. Each light's row also dims the map. Explain a light here, not in the header.

### TeamPopover

`apps/web/src/features/map/team-popover.tsx`. Shows one or more teams' tasks, opened from Teams just before Key. Each team is a checkbox row with its task count, and a last "No team" row, its name in `muted` and with no Open, picks the tasks nobody has; it counts as one more pick in the chip ("No team only ×", "Till and No team ×"). With no teams at all, the popover says "No teams yet" over Add team, and a No team pick is dropped. Picking fades every other task, folds away chapters with none of theirs by setting the chapter focus, and puts a chip filled with `ink` in the header row to clear it. The chip says "only" for one team ("Till only ×"), and drops it for more: "Bench and Till ×", "3 teams ×", or "All teams ×". It's also where teams are added, with Add team at the end of the list, and where Open on a row shows that team in the drawer. A link that opens something in its drawer, on a chapter, a team or a persona, says "Open", because the drawer holds more than the name. Esc in the Add team field ends only the field. Picking teams never reorders tasks, and teams have no colour. The logic lives in `teams.ts`. `docs/designs/teams-direction.md` has the reasoning.

### PersonaPopover

`apps/web/src/features/map/persona-popover.tsx`. Shows one or more personas' tasks, opened from Personas between Teams and Key. Each persona is a checkbox row with its glyph and its task count, where a task counts if it or any of its subtasks or steps is theirs. Picking fades every task whose roll-up has none of them, folds away chapters with none of theirs by setting the chapter focus, and draws the picked personas' glyphs in `ink` on the rows. Inside a task on show, a subtask or step with personas, none of them picked, fades too, and one with none follows its parent; nothing fades twice. A chip filled with `ink` shows the picked glyphs and clears them, worded like the team chip ("Front desk only ×", "Rider and Owner ×", "3 personas ×", "All personas ×"). With teams picked as well, only tasks matching both show, and Show the whole story clears both. A task added while exactly one persona is picked takes it, in the same change, so Undo takes both away. With no personas on the map, there's no Personas button. The logic lives in `personas.ts`.

Esc inside any popover only closes it: page-wide Esc handlers skip events from inside one (`isInPopover` in `apps/web/src/ui/popover.tsx`), so picks, the chapter focus and the drawer stay.

### TeamField

`apps/web/src/features/map/team-field.tsx`. A task's or subtask's team, in the drawer under the name. A task offers "No team"; a subtask offers "Same as its task (Bench)" instead, which follows its task. A change shows at once and puts the old team back if it can't be saved.

### Persona icons

`apps/web/src/features/map/persona-icon.tsx`. Eight one-colour line glyphs drawn for Litmus on a 16 px grid, 1.4 stroke, `currentColor`: `person`, `wrench`, `bell`, `box`, `key`, `house`, `phone`, `star`. Never use emoji or initials instead: emoji bring their own colour, and colour means a light. Each glyph carries its persona's name as its accessible name and tooltip, unless the name sits beside it. `PersonaName` puts them after a row's name, 14 px, `muted`, 6 px after the last word and 4 px apart, and keeps the last word and the glyphs on one line so the glyphs never sit alone. Task rows show their own personas and their subtasks' and steps'; subtask rows their own and their steps'; step rows their own. `docs/designs/personas-direction.md` has the reasoning.

### PersonaField

`apps/web/src/features/map/persona-field.tsx`. Who carries out a task, subtask or step, in the drawer under Team (under the name for a step). One toggle button per persona, filled with `ink` when it's on, and any number can be on. A change shows at once and saves at once, and if it can't be saved the button goes back with "That persona couldn't be saved, so it hasn't changed." Personas set further down aren't buttons here; they're listed under them after "Also from its subtasks:" or "Also from its steps:", because that's where they're set. With no personas on the map, the field doesn't show.

### Popover

`apps/web/src/ui/popover.tsx`. Use for content opened from a button that shouldn't stay on the page. It opens under its trigger, keeps 16 px inside the window, fades in with opacity, and returns focus to the trigger when it closes.

### Disclosure

`apps/web/src/ui/disclosure.tsx`. Use for any row that reveals nested content. Panels use `hiddenUntilFound`, so the browser's find-in-page reaches collapsed text.

### Chapter

`apps/web/src/features/map/chapter.tsx`. One activity in the story, in one of three states: at rest, focused, or in the background. In the background it shows only its number and name, because that's all a squad needs to add it to the focus. Don't show tasks or health there. A row opens the drawer, and only the chevron and mix bar expand subtasks. A subtask's chevron and count expand its steps in the same way. `docs/designs/focus-direction.md` has the reasoning.

### Drawer

`apps/web/src/features/map/drawer.tsx`. Where a task's detail lives, and where names are edited. It runs the full height of the window at the right edge, and the page makes room for it, so the map and its controls stay usable. On a phone it fills the screen. An X at the top closes it and stays in view while the drawer scrolls. It holds the name, the team, the personas, the light and the review, a step's name and note, and a team's name with its tasks under their chapters and a Remove team button, which asks in a popover on the button, then keeps the tasks and clears their team, with the usual Undo. Add new task detail here rather than to the row. `docs/designs/task-drawer-direction.md` has the reasoning.

### RatingSection

`apps/web/src/features/map/rating-section.tsx`. How a light gets set: pick a light, write a review, then set it. The map waits until then. Never let a light change on the map from a single click. The lights are icon-only, because `LightMark` already reads without colour; each has an accessible name and a tooltip. `docs/designs/rating-direction.md` has the reasoning.

### Moving tasks

`apps/web/src/features/map/use-task-drag.ts` and `move-section.tsx`. Press and move a row to drag it with a mouse or pen. A line shows where it lands, and an outline shows it going inside a task, into a subtask (for a step), or to the end of a chapter. Anything draggable must also be reachable from the drawer's Move controls, for keyboard and touch: up and down arrows beside the light (under the note for a step, which has no light), and Move to on its own line. Every move gets a visible Undo.

### Adding

`apps/web/src/features/map/add-field.tsx`. How anything new gets on the map. A name goes straight into a field where the item will appear, with no empty item saved first. Enter adds, Esc gives up, and leaving adds anything typed. Tasks and subtasks stay open for the next one, and Enter on an empty field finishes. New items take no light, so they show grey. Every add gets the same visible Undo as a move. `docs/designs/adding-direction.md` has the reasoning.

### Steps

`apps/web/src/features/map/step-mark.tsx` and `note-field.tsx`. A breakdown under a subtask, with a name and a note. Steps take no light, so they get a dash, never a `LightMark`, and don't count in a `MixBar`. `docs/designs/steps-direction.md` has the reasoning.

### LightMark

`apps/web/src/features/map/light-mark.tsx`. Use wherever a light appears. The fill rises with the level of support, so it reads without colour. Don't use a coloured dot instead. Pair it with screen-reader text unless a visible label sits beside it.

### MixBar

`apps/web/src/features/map/mix-bar.tsx`. Use to summarise lights across several tasks. It shows counts in a fixed order. Never add a percentage, a score or a sort.
