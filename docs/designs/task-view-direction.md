# Decision: the task view

Decided by Scott on 2026-11-10, from a live prototype with three working directions on the invented sample map (branch `proto/task-view-96`, #96). Method: the prototype pattern from #90 (`emil-prototype`), then `emil-ui-review` and `emil-unslop-design` on the chosen direction.

**The need:** the drawer says what a task is, what hurts and what might help, in at most five items a section. Teams working to improve a task need more room. They need every pain point with what users said, and how its light has moved and why. And while they focus on one task, they need to see what happens before and after it in the story.

**Chosen: Split.** A page of its own, with the whole story in a column beside it.

**What must stay true:** this is not a research repository. The view holds enough to build empathy and show pain points and opportunities. It doesn't hold every quote from every interview with a link to its source. Quotes sit under the pain point they illustrate, so a pile of quotes saying the same thing shows as one pain point with several voices, not as a longer list.

## The page

At `/task/[id]`, for a task, a subtask or a step. Each has its own page, because a task can hold many subtasks that are each worth improving, and each needs its own focus.

**Desktop (1024 px and up):** two columns, `20rem` and the rest.

- **The story, on the left.** Sticky, full height, scrolling on its own. A back link, "Spoke, the workshop app", returns to the map with this task's drawer open (`/?task=<id>`). Below it, every chapter by number and name, 17 px in the story face. The chapter holding this page is open, and inside it only the branch holding this page opens down to subtasks and steps. Any other chapter opens in place. Each task shows its light mark, with the light named for screen readers. The current row has the map's selected fill, `aria-current="page"`, and scrolls into view when the page opens.
- **The page, on the right.** Centred, at most `44rem`, so lines stay readable.

**Phone (under 1024 px):** one column. The story folds behind a row at the top, "Chapter 4 · Diagnose", 44 px tall. The path above the name, and the list of subtasks or steps, show only here, because the story column says them on desktop.

**In order, down the page:**

1. **The name**, 34 px in the story face, balanced.
2. **Who and Team**, as a two-column list at 13 px. Labels "Who" and "Team" are muted, and values are ink with their glyphs. The map and drawer leave these unlabelled to save room. This page has the room, so it's where the glyphs are learned.
3. **The light now.** Its mark and name. A leaf shows its latest review. A parent shows the mix bar and "Set by its subtasks: 1 green, 2 yellow, 3 red, 1 grey, 1 out of scope."
4. **Summary.** One to four sentences.
5. **Pain points.** Each pain point, with the quotes that illustrate it set under it behind a 2 px rule, each with its persona's glyph and a participant label such as "P3, mechanic". Quotes not yet placed under a pain point go last, under "Heard, but not yet placed under a pain point".
6. **How might we better support this task?** The ideas. Says "subtask" or "step" as fitting.
7. **History.** Every change to the light, newest first. Each shows the day ("4 Nov"), the move ("Red, down from yellow", "Yellow, up from red", "Added, grey", "Review updated"), and the note written with it. There's no author until there are accounts. A parent's changes each name and link the subtask that caused them.
8. **Before and after.** At the foot, the tasks either side in story order: siblings for a task, the parent's other subtasks for a subtask, the subtask's other steps for a step.

Steps take no light, so a step's page has no light and no history.

## States

- **No research:** "No research on this task yet." in place of the summary, pain points and ideas.
- **No history:** one entry, "Added, grey".
- **Not found:** the app's 404.

## Rules

- **The light log is append-only.** Setting a light adds an entry with its note. Lights can move towards green or regress, and the log shows both. This replaces "Only the latest review is kept". Undo still removes the entry it made, because undo puts back the whole record.
- **A parent's history is derived, not stored.** It's replayed from its subtasks' logs, so it can't disagree with them. A parent changes only when its derived light changes. Moving a subtask to another task rewrites both parents' histories to match their subtasks now, and that's accepted: storing parent entries would mean every command that can change a parent's light writing one.
- **Nothing rolls up.** A task, a subtask and a step each have their own research, as in the drawer.
- **A quote isn't rating evidence.** It never backs a light (`docs/product/rating-model.md`).
- **The drawer stays a summary.** It keeps at most five items a section, and links here with "Open task view".

## Rejected

- **Page** (a single column, the story reduced to before and after arrows in a sticky header). It focuses well, but you lose sight of where the task sits in the story, which is the context the page is for.
- **Sheet** (a wide panel over the map, two columns inside). The map stays visible behind it, but it's cramped for a growing page, Escape has to close the sheet without closing the drawer, and it has no address to share.

## What it needs from outside

- **Accounts,** before a change can say who wrote it.
- **How research is entered.** The drawer is read-only for research, and this page is meant to be where it's recorded. Editing wasn't prototyped.

## Build split

One PR each, in order, red-green-refactor commits.

1. **The light log** (#99). `rateTask` appends rather than replaces. The map view reads the latest rating per task, by `ratedAt`. A new `getTaskView` in `application` returns the subject, its place in the story, its neighbours and its history, replaying a parent's history from its subtasks with the cause named. Scope: `packages/core/src/application/rate-task.ts`, `get-map-view.ts`, new `get-task-view.ts`, `domain/map/parent-light.ts`. Tests: `rate-task.app.test.ts`, `get-map-view.app.test.ts`, new `get-task-view.app.test.ts`, `parent-light.unit.test.ts`.
2. **Quotes under pain points** (#100). `Research.pains` becomes `{ text, quotes }[]`, and `hearing` keeps only quotes not yet placed. Invented sample research moves to the new shape. The drawer's "What we're hearing" shows up to five quotes, pain points' first. Scope: `domain/map/story-map.ts`, `adapters/in-memory/sample-research.ts`, `apps/web/src/features/map/research.ts`. Tests: `research.app.test.ts`, `research.unit.test.ts`. Can run beside 1.
3. **The page** (#102). `/task/[id]`, read-only, as described above. Moves the prototype's sections out of `proto-task-view/` into `features/task-view/`, wires them to `getTaskView`, and deletes the picker, Page, Sheet and `/proto-task`. The drawer's "Open task view" becomes a plain link. Fixes the three findings left on #96: the screencast mark that doesn't play (gone, with support today), the outline's focus ring, and scrolling to the current task when the phone outline opens. Scope: a new `task` route in `apps/web/src/app`, a new `task-view` folder in `apps/web/src/features`, and `features/map/drawer.tsx`. Tests: new `task-view.unit.test.ts` for the outline's branch and the history's wording. After 1 and 2. Design pass before it lands.
4. **Set the light from the page** (#103). The drawer's rating control, under "The light now", adding to the log. Scope: `features/task-view/`. After 3.
5. **Recording research** (#104). Design first, as its own prototype: adding and editing the summary, pain points, quotes and ideas, and placing a loose quote under a pain point. Not built from this doc.

## Cut for now

**How Spoke supports it today** (Scott, 2026-11-10). The prototype showed it as a written path per product with screenshots and screencasts, under the ideas. It's out of the build until it's wanted again. #101 (the written path) and #105 (media) are closed as not planned, ready to reopen. Settled question 2 below applies if it returns.

## Settled by Scott, 2026-11-10

1. **Who wrote a change:** left out until there are accounts. History shows the day and the note.
2. **Screenshots and screencasts:** wait for uploads.
3. **A parent's history:** worked out from its subtasks' logs, not stored.
4. **Quotes in the drawer:** "What we're hearing" stays, with up to five quotes, pain points' first.
