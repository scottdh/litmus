# DESIGN.md

Describes what exists, so don't document things that don't. See `docs/agents/skills.md` for which skill to use when, and `docs/designs/wall-direction.md` for why the map looks as it does.

The character: quiet, reading-first, editorial. Colour is small and means something. Nothing is decorated.

## Tokens

All tokens live in `apps/web/src/app/globals.css`. Lint rejects hardcoded colours in components. Themes flip the variables, so never write `dark:` for colour.

| Use                                          | Token                                                     |
| -------------------------------------------- | --------------------------------------------------------- |
| Page, raised surface                         | `canvas`, `surface`                                       |
| Hover and the selected row on the page       | `sunken`, with `shadow-current` for the selected row      |
| Text, secondary text                         | `ink`, `muted`                                            |
| Dividers                                     | `line`, at `--hairline` width                             |
| A light drawn on the page, as a mark or bar  | `mark-green`, `mark-yellow`, `mark-red`, `mark-grey`      |
| A control filled with a light, with its text | `light-*` with `on-light-*`                               |
| A control that removes something             | `danger` as text, never as a fill                         |
| Out of scope                                 | The `hatch` utility with `muted` text                     |
| Elevation                                    | `shadow-raised`, which becomes a single ring in dark mode |

Every `on-light-*` is at least 4.5:1 on its fill. Every `mark-*` is at least 3:1 on `canvas`, `surface` and `sunken`, and `danger` at least 4.5:1. Recheck if you change any of them. `danger` stays text on the quiet button, because a red fill would read as a red light, like the "Red only" chip.

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

Hover goes a shade darker: a raised control or a popover row dips from `surface` to `canvas`, and a row on the page, which is already `canvas`, dips to `sunken`. Hover and press take 150 ms `ease-out`; list the properties, because lint bans `transition-all`. Press scales to 0.96. Panels fade in with opacity and never animate height. The drawer is the exception: it slides in from the right with `--motion-focus`. Chapter focus uses `--motion-focus`, 240 ms. It's the one place a width animates, which is allowed because task text sits in a fixed-width box and nothing reflows. `globals.css` handles reduced motion.

## Components

Shared components live in `apps/web/src/ui` and are the only place that imports Base UI. Product components live in `apps/web/src/features/map`.

### Buttons and fields

`apps/web/src/ui/button.tsx` and `apps/web/src/ui/control.ts`. A button is `<Button variant shape>`, which defaults to `type="button"` and passes every other prop and the ref through. A Base UI trigger (`PopoverTrigger`, `PopoverClose`) takes the same classes from `button({ variant, shape })` on its `className`. `variant` is required, and every variant but `fill` carries its own hover, so a button can't ship without one. `className` takes only layout (`shrink-0`, `flex gap-1.5`, a margin) or a text colour such as `text-danger`. Never hand-roll a button's surface, ring or hover. A new variant goes in `control.ts`, and its test checks it has a hover.

| Variant  | For                                                                            | Hover                      |
| -------- | ------------------------------------------------------------------------------ | -------------------------- |
| `raised` | Any button with a job: Save, Add step, Key, the move arrows, an unpicked light | `surface` dips to `canvas` |
| `quiet`  | A secondary action with no surface: Cancel, Add task under a chapter           | `muted` text goes to `ink` |
| `fill`   | A control filled with its meaning: the picked light, a header chip, Remove     | None; press still scales   |
| `on-ink` | Text on the `ink` toast                                                        | The underline goes solid   |

A `fill` stays put on hover because a darker light reads as a different light. A `raised` button with `aria-disabled` goes `muted` and stops reacting to hover and press, so don't add disabled styles at the call site. `shape="icon"` is the 32 px square, 44 px tall on a phone.

Fields: `SELECT` for a dropdown (with `SelectChevron`), `TEXT_BOX` for a boxed note or review, and `LINE_FIELD` for a name written where it lives on the page. A `LINE_FIELD` shows focus by turning its rule `ink`, not with the outline, because opening a drawer focuses the name. Field labels are 13 px `muted`; a message that something couldn't be saved is `ink`. A tile that's really a radio, like the persona icons, uses `RAISED` on its label. Rows (a task, a pick row in a popover) aren't buttons in this sense; they fill as `Motion` describes.

### Header

`apps/web/src/features/map/story-wall.tsx`. One hairline-ruled row: the map name, a Sample tag when the data is invented, the live status line, then the buttons. The lights aren't explained on the page, because people learn them quickly. When the map is dimmed to one light, a chip filled with that light says so and clears it. Picked teams and picked personas each get a chip in the same way. `docs/designs/header-direction.md` has the reasoning.

### KeyPopover

`apps/web/src/features/map/key-popover.tsx`. Where the lights are explained: each light and its meaning, the definition of green, and the sample notice. Each light's row also dims the map. Explain a light here, not in the header.

### TeamPopover

`apps/web/src/features/map/team-popover.tsx`. Shows one or more teams' tasks, opened from Teams just before Key. Each team is a checkbox row with its task count, and a last "No team" row, its name in `muted` and with no Open, picks the tasks nobody has; it counts as one more pick in the chip ("No team only ×", "Till and No team ×"). With no teams at all, the popover says "No teams yet" over Add team, and a No team pick is dropped. Picking fades every other task, folds away chapters with none of theirs by setting the chapter focus, and puts a chip filled with `ink` in the header row to clear it. The chip says "only" for one team ("Till only ×"), and drops it for more: "Bench and Till ×", "3 teams ×", or "All teams ×". It's also where teams are added, with Add team at the end of the list, and where Open on a row shows that team in the drawer. A link that opens something in its drawer, on a chapter, a team or a persona, says "Open", because the drawer holds more than the name. Esc in the Add team field ends only the field. Picking teams never reorders tasks, and teams have no colour. The logic lives in `teams.ts`. `docs/designs/teams-direction.md` has the reasoning.

### PersonaIconField

`apps/web/src/features/map/persona-icon-field.tsx`. A persona's icon, in its drawer under the name: the eight glyphs as one row of radio buttons, the chosen one filled with `ink`. A change shows at once and saves at once, and if it can't be saved the old icon comes back with "That icon couldn't be saved, so it hasn't changed."

### PersonaPopover

`apps/web/src/features/map/persona-popover.tsx`. Shows one or more personas' tasks, opened from Personas between Teams and Key. Each persona is a checkbox row with its glyph and its task count, where a task counts if it or any of its subtasks or steps is theirs. Picking fades every task whose roll-up has none of them, folds away chapters with none of theirs by setting the chapter focus, and draws the picked personas' glyphs in `ink` on the rows. Inside a task on show, a subtask or step with personas, none of them picked, fades too, and one with none follows its parent; nothing fades twice. A chip filled with `ink` shows the picked glyphs and clears them, worded like the team chip ("Front desk only ×", "Rider and Owner ×", "3 personas ×", "All personas ×"). With teams picked as well, only tasks matching both show, and Show the whole story clears both. A task added while exactly one persona is picked takes it, in the same change, so Undo takes both away. It's also where personas are added, with Add persona at the end of the list (a new persona wears the first icon nobody has), and where Open on a row shows that persona in the drawer. With no personas at all, the popover holds only Add persona. The logic lives in `personas.ts`.

Esc inside any popover only closes it: page-wide Esc handlers skip events from inside one (`isInPopover` in `apps/web/src/ui/popover.tsx`), so picks, the chapter focus and the drawer stay.

### TeamLine

`apps/web/src/features/map/team-line.tsx`. Who turns a task or subtask from grey to green, as a `muted` 13 px line under its personas, because a team changes about once a year. A small two-heads mark comes first, drawn like the persona glyphs and spaced like one, so the two lines start together. A team set on the item is in `ink`; a subtask with none of its own reads "Bench, same as its task", all `muted`, like personas set further down. With no team it reads "Add a team". Otherwise it ends with the same chevron as the persona byline. The line opens a pick-one list: "No team" on a task, "Same as its task" with the task's team under it on a subtask, then each team. A pick shows at once, saves at once and closes the list; if it can't be saved the old team comes back with "That team couldn't be saved, so it hasn't changed." The list is a radio group, so Tab stops once and the arrows move.

### Persona icons

`apps/web/src/features/map/persona-icon.tsx`. Eight one-colour line glyphs drawn for Litmus on a 16 px grid, 1.4 stroke, `currentColor`: `person`, `wrench`, `bell`, `box`, `key`, `house`, `phone`, `star`. Never use emoji or initials instead: emoji bring their own colour, and colour means a light. Each glyph carries its persona's name as its accessible name and tooltip, unless the name sits beside it. `PersonaName` puts them after a row's name, 14 px, `muted`, 6 px after the last word and 4 px apart, and keeps the last word and the glyphs on one line so the glyphs never sit alone. Task rows show their own personas and their subtasks' and steps'; subtask rows their own and their steps'; step rows their own. `docs/designs/personas-direction.md` has the reasoning.

### PersonaByline

`apps/web/src/features/map/persona-byline.tsx`. Who carries out a task, subtask or step, as a `muted` 13 px line under its name, because personas are set once and rarely changed. Its own personas come first in `ink`, then those set further down "from its subtasks" or "from its steps". With none it reads "Add personas". Otherwise a `muted` chevron, the dropdowns' arrow, ends the line, glued to the last word so it never wraps alone, and goes `ink` on hover, because a phone has no hover to show the line opens anything. The team line shares it, and the trigger styles, from `line-trigger.tsx`. The line opens a checklist popover where any number can be ticked; a change shows at once and saves at once, and if it can't be saved the tick goes back with "That persona couldn't be saved, so it hasn't changed." Personas set further down are ticked, greyed and locked there, saying which subtask or step they come from, because that's where they're changed. Show a locked choice like this rather than listing it a second time. With no personas on the map, the line doesn't show.

### Popover

`apps/web/src/ui/popover.tsx`. Use for content opened from a button that shouldn't stay on the page. It opens under its trigger, keeps 16 px inside the window, fades in with opacity, and returns focus to the trigger when it closes.

### Disclosure

`apps/web/src/ui/disclosure.tsx`. Use for any row that reveals nested content. Panels use `hiddenUntilFound`, so the browser's find-in-page reaches collapsed text.

### Chapter

`apps/web/src/features/map/chapter.tsx`. One activity in the story, in one of three states: at rest, focused, or in the background. In the background it shows only its number and name, because that's all a squad needs to add it to the focus. Don't show tasks or health there. A row opens the drawer, and only the line under a task's name (its mix bar, "4 subtasks" and chevron) expands subtasks; it sits under the name so a long name gets the full width. A row fills with `sunken` on hover, reaching 6 px past its text so nothing moves, and keeps the fill with the `shadow-current` ring while its drawer is open. The expand control fills on its own, as a separate target. Nothing fills while a row is dragged. Names aren't underlined: a fill shows the whole target, and goes darker like every other control. Surface (lighter) and an `ink` tint (darker in light, lighter in dark) were tried and rejected. A subtask's chevron and count expand its steps in the same way. `docs/designs/focus-direction.md` has the reasoning.

### Drawer

`apps/web/src/features/map/drawer.tsx`. Where a task's detail lives, and where names are edited. It runs the full height of the window at the right edge, and the page makes room for it, so the map and its controls stay usable. On a phone it fills the screen. An X at the top closes it and stays in view while the drawer scrolls. It holds the name, the team, the personas, the light and the review, a step's name and note, a persona's name, its icon and the tasks it rolls up to under their chapters, and a team's name with its tasks under their chapters. A team's drawer ends with Remove team and a persona's with Remove persona. Both ask in a popover on the button (`RemoveConfirm`), then keep the tasks and clear the team or persona from them, with the usual Undo. It reads in groups, 24 px apart: what it is (name, personas, a persona's icon), then its team, light or note with the move arrows and Move to, then, under a hairline, what's under it (subtasks or steps, and Add). A row in the drawer that opens something dips from `surface` to `canvas` on hover, like a popover row, and its mark sits centred on the first line; it's `DrawerRow`, so don't copy the markup. On a phone the name isn't focused on opening, so the keyboard doesn't cover the drawer. Add new task detail here rather than to the row. `docs/designs/task-drawer-direction.md` has the reasoning.

### RatingSection

`apps/web/src/features/map/rating-section.tsx`. How a light gets set: pick a light, write a review, then set it. The map waits until then. Never let a light change on the map from a single click. The lights are icon-only, because `LightMark` already reads without colour; each has an accessible name and a tooltip. `docs/designs/rating-direction.md` has the reasoning.

### Moving tasks

`apps/web/src/features/map/use-task-drag.ts` and `move-section.tsx`. Press and move a row to drag it with a mouse or pen. A line shows where it lands, and an outline shows it going inside a task, into a subtask (for a step), or to the end of a chapter. Anything draggable must also be reachable from the drawer's Move controls, for keyboard and touch: up and down arrows beside the light (under the note for a step, which has no light), and Move to on its own line. Every move gets a visible Undo.

### Changes, confirms and Undo

`apps/web/src/features/map/undo-toast.tsx` and `remove-confirm.tsx`. One rule for every change that can be undone. A change that **loses data** (removing a team or a persona, and deleting anything when that arrives) asks first in a popover on its button, with Cancel focused and a solid `danger` button, then gets Undo like everything else. **Every other** undoable change (adding, moving) just happens, then shows a toast at the bottom centre with what changed, Undo and ×. The toast is `ink` on `surface`, never green, because green is a light. A neutral check leads the message, so it reads as done at a glance. It stays 8 s, waits while hovered or focused, gives way to the next change's toast, and centres on the map when a drawer is open. The header keeps its Undo as the fallback once the toast has gone. Never confirm a change that loses nothing. `docs/designs/teams-direction.md` §13 has the reasoning.

### Adding

`apps/web/src/features/map/add-field.tsx`. How anything new gets on the map. A name goes straight into a field where the item will appear, with no empty item saved first. Enter adds, Esc gives up, and leaving adds anything typed. Tasks and subtasks stay open for the next one, and Enter on an empty field finishes. New items take no light, so they show grey. Every add gets the same visible Undo as a move. `docs/designs/adding-direction.md` has the reasoning.

### Steps

`apps/web/src/features/map/step-mark.tsx` and `note-field.tsx`. A breakdown under a subtask, with a name and a note. Steps take no light, so they get a dash, never a `LightMark`, and don't count in a `MixBar`. `docs/designs/steps-direction.md` has the reasoning.

### LightMark

`apps/web/src/features/map/light-mark.tsx`. Use wherever a light appears. The fill rises with the level of support, so it reads without colour. Don't use a coloured dot instead. Pair it with screen-reader text unless a visible label sits beside it.

### MixBar

`apps/web/src/features/map/mix-bar.tsx`. Use to summarise lights across several tasks. It shows counts in a fixed order. Never add a percentage, a score or a sort.
