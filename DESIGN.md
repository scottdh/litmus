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
| Out of scope                                 | The `hatch` utility with `muted` text                     |
| Elevation                                    | `shadow-raised`, which becomes a single ring in dark mode |

Every `on-light-*` is at least 4.5:1 on its fill. Every `mark-*` is at least 3:1 on `canvas` and `surface`. Recheck if you change either.

## Type

Two faces, set in `apps/web/src/app/layout.tsx`. Use nothing else.

| Role                | Style                                                |
| ------------------- | ---------------------------------------------------- |
| Chapter heading     | `font-story`, 28 px, line height 1.1, slightly tight |
| Chapter on a rail   | `font-story`, 17 px, line height 1.2, `muted`        |
| Page title          | Sans, 22 px, semibold                                |
| Task                | Sans, 15 px, line height 1.35                        |
| Subtask             | Sans, 14 px, `muted`                                 |
| Labels and captions | Sans, 13 px                                          |
| Counts              | 12 px or 13 px, always `tabular-nums`                |

Names are never truncated in the Story view.

## Motion

Hover and press take 150 ms `ease-out`; list the properties, because lint bans `transition-all`. Press scales to 0.96. Panels fade in with opacity and never animate height. Chapter focus uses `--motion-focus`, 240 ms. It's the one place a width animates, which is allowed because task text sits in a fixed-width box and nothing reflows. `globals.css` handles reduced motion.

## Components

Shared components live in `apps/web/src/ui` and are the only place that imports Base UI. Product components live in `apps/web/src/features/map`.

### Disclosure

`apps/web/src/ui/disclosure.tsx`. Use for any row that reveals nested content. Panels use `hiddenUntilFound`, so the browser's find-in-page reaches collapsed text.

### Chapter

`apps/web/src/features/map/chapter.tsx`. One activity in the story, in one of three states: at rest, focused, or in the background. In the background it shows only its number and name, because that's all a squad needs to add it to the focus. Don't show tasks or health there. A row opens the drawer, and only the chevron and mix bar expand subtasks. `docs/designs/focus-direction.md` has the reasoning.

### Drawer

`apps/web/src/features/map/drawer.tsx`. Where a task's detail lives, and where names are edited. It sits beside the story in the page flow, not over it, so the map stays usable and the page doesn't move vertically. On a phone it fills the screen. It holds the name, the light and the review. Add new task detail here rather than to the row. `docs/designs/task-drawer-direction.md` has the reasoning.

### RatingSection

`apps/web/src/features/map/rating-section.tsx`. How a light gets set: pick a light, write a review, then set it. The map waits until then. Never let a light change on the map from a single click. `docs/designs/rating-direction.md` has the reasoning.

### LightMark

`apps/web/src/features/map/light-mark.tsx`. Use wherever a light appears. The fill rises with the level of support, so it reads without colour. Don't use a coloured dot instead. Pair it with screen-reader text unless a visible label sits beside it.

### MixBar

`apps/web/src/features/map/mix-bar.tsx`. Use to summarise lights across several tasks. It shows counts in a fixed order. Never add a percentage, a score or a sort.
