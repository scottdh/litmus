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
| Page title          | Sans, 22 px, semibold                                |
| Task                | Sans, 15 px, line height 1.35                        |
| Subtask             | Sans, 14 px, `muted`                                 |
| Labels and captions | Sans, 13 px                                          |
| Counts              | 12 px or 13 px, always `tabular-nums`                |

Names are never truncated in the Story view.

## Motion

Hover and press take 150 ms `ease-out`; list the properties, because lint bans `transition-all`. Press scales to 0.96. Panels fade in with opacity and never animate height. `globals.css` handles reduced motion.

## Components

Shared components live in `apps/web/src/ui` and are the only place that imports Base UI. Product components live in `apps/web/src/features/map`.

### Disclosure

`apps/web/src/ui/disclosure.tsx`. Use for any row that reveals nested content. Panels use `hiddenUntilFound`, so the browser's find-in-page reaches collapsed text.

### LightMark

`apps/web/src/features/map/light-mark.tsx`. Use wherever a light appears. The fill rises with the level of support, so it reads without colour. Don't use a coloured dot instead. Pair it with screen-reader text unless a visible label sits beside it.

### MixBar

`apps/web/src/features/map/mix-bar.tsx`. Use to summarise lights across several tasks. It shows counts in a fixed order. Never add a percentage, a score or a sort.
