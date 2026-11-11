# Decision: recording research in the task view

Decided by Scott on 2026-11-11, from a live prototype with four working directions on the invented sample map (branch `proto/task-research-104`, #104). The prototype is deleted. This doc is what survives it.

**The need:** the task view shows a task's research, but nothing records it. A team needs to add, edit and remove the summary, pain points, what they've heard and ideas, where they read it, without the page turning into a form or the research into a repository.

**Chosen: Flat.** Pain points and quotes are two separate lists, each edited in place. A quote isn't placed under a pain point. This reverses "quotes sit under the pain point they illustrate" from `docs/designs/task-view-direction.md` and the shape #100 built for it.

**Why:** the three directions that nested quotes under pain points showed the cost of nesting. Most of their weight was placing quotes, not writing them: a not-yet-placed bucket, a move menu, dragging, a "Place it under" choice every time a quote was added, and somewhere for a removed pain point's quotes to go. Two lists drop all of that. The drawer already shows research as flat lists, and it reads fine.

**What nesting did, and what replaces it:** nesting made five quotes saying the same thing show as one pain point with five voices, the main guard against a research repository. Flat keeps that guard by catching repeats before they're added, within each list, and by suggesting sharpening once a list grows. It suggests, it never blocks.

## The section

In the task view's main column, in this order. Each heading is 15 px semibold, and the sections are spaced as the read view is today.

1. **Summary.** The text itself is the field. Placeholder: "One to four sentences on what this task is and why it's hard" ("subtask" or "step" as fitting).
2. **Pain points.** A bulleted list, 15 px at 1.6 line height, with a 5 px muted disc centred on the first line, 4 px between items. Normal weight: a pain point isn't a heading. Then a quiet **Add a pain point** with a plus.
3. **What we're hearing.** Every quote, 14 px at 1.55, 16 px between quotes, no rule beside them. The opening mark hangs 0.4 em into the margin so the words line up with the column, as in the drawer. Under each quote, 13 px muted, the persona's glyph and the participant label, such as "P3, mechanic". Then a quiet **Add what someone said** with a plus.
4. **How might we better support this task?** A bulleted list styled like pain points, then a quiet **Add an idea**.

This mirrors the drawer's styling (`features/map/research-section.tsx`) at the task view's larger size.

### Editing in place

- Every summary, pain point, quote and idea is a field that reads as text: no border until hovered (sunken fill) or focused (canvas fill, 1 px ink inset). It grows with its text.
- **Leaving the field or pressing Enter keeps the change.** In the summary and in quotes, which run long, Enter adds a line and Cmd or Ctrl and Enter keeps it. **Esc puts it back.**
- **Clearing a field and leaving removes the item**, the same as its ×.
- Each item has a quiet × at its right, named for what it removes ("Remove this pain point", "Remove what P3, mechanic said", "Remove this idea"). It shows on hover or focus within the row, and always where there's no hover. It never adds height to the row.
- A typed edit has no Undo, because Esc covers it while editing. Adding and removing do have Undo.

### Adding

- **A pain point or an idea:** a line field opens where the item will appear. Enter adds it, Esc gives up. Under it, in 13 px muted: "Enter adds it. Esc gives up." For ideas: "Enter adds it and starts another. Esc finishes."
- **A quote:** a small raised form opens in place with three fields, each with a visible label:
  - **What they said.** A text field. Surrounding quote marks are stripped on adding.
  - **Persona.** A select with "None" and the map's personas.
  - **Participant.** Placeholder "P9, mechanic". No autocomplete or spellcheck, and password managers ignore it.

  Then **Add** (raised) and **Cancel** (quiet). Add is unavailable until there are words and a participant. Cmd or Ctrl and Enter adds from anywhere in the form, and Esc cancels.

### Repeats, before they're added

A quiet note (13 px, sunken fill) appears under whatever's being written once it reads like something already in the same list:

- Pain point: "Close to one you have: "…". Sharpen that one instead?"
- Quote: "Sounds like what P7, stock keeper said: "…". Add it only if it says something new."
- Idea: "Close to an idea you have: "…"."

Nothing stops adding. The check is a plain word overlap: lower-case words longer than two letters, without common stopwords, with endings like -s, -es, -ed and -ing stripped. It needs at least three words written and two shared, and a score of 0.4 or more (shared words over the shorter text's count). It's crude, and that's enough until it proves otherwise. Matching across lists, such as a quote against a pain point, is out.

### Growing lists

Past five pain points or six quotes, a line in 13 px muted under the list says:

- "6 pain points. Fewer, sharper ones read better than many."
- "7 voices. A few that say it clearly beat many that say it twice."

### Undo

Adding and removing show the existing Undo toast (`features/map/undo-toast.tsx`), bottom centre: "Added a pain point", "Removed a pain point", "Added what P9, mechanic said", "Removed what P3, mechanic said", "Added an idea", "Removed an idea". A status line announces the same words to screen readers.

### At 375 px

The same section in one column. Fields are 16 px, so iOS doesn't zoom. The × is always visible and 44 px wide. The persona and participant fields sit side by side, each 44 px tall.

## States

- **No research:** each heading shows with its Add, and the summary field shows its placeholder. The read view's "No research on this task yet" line doesn't show here, because the page is where research is written.
- **Saving:** changes save in the background and show at once. If a save fails, the change is put back and the page says so in the toast's place: "Couldn't save that. Try again."
- **Undo out of date:** if the map changed since, Undo fails as it does for the map (`UNDO_OUT_OF_DATE`), and the toast says "Couldn't undo that. Something has changed since."

## Rules that stay

- **Not a research repository.** No link to a source, no interview list, no tags. A quote carries only its words, a persona and a participant label.
- **Tasks, subtasks and steps each have their own research.** Nothing rolls up.
- **A quote isn't rating evidence.** It never backs a light (`docs/product/rating-model.md`).
- **The drawer stays read-only**, with at most five items a section. Its quotes are now simply the first five, in order. The "pain points' first" ordering goes with nesting.
- **Invented data only.** Sample research stays invented.

## Rejected

- **Nesting quotes under pain points**, in any form. It reads richer, a pain point with its voices beneath it, but every way of recording it made placing a step of its own. Repeat checks within flat lists keep most of what it was for.
- **In place, nested** (direction 1). Flat's editing came from here, but with Move and a not-yet-placed bucket on every quote, and a "Put it there instead" nudge when adding.
- **Edit mode** (direction 2). The page reads as it does today, and **Edit research** opens a board: a "To place" tray, quotes dragged onto pain point cards, and **Merge into it** for repeats. Good for sorting a batch in one sitting. But it's a mode, it's form-heavy, and it merges repeats after they're added rather than catching them before.
- **Quote first** (direction 3). One **Add what you heard** form suggests the pain point a quote sounds like, and a pain point can only start from a quote. It pushed hardest towards fewer, sharper pain points. But a pain point with no quote takes a detour, and the ⋯ menus add clicks to every edit.
- **Bold pain points.** Tried in the first Flat. The weight added nothing: a pain point isn't a heading, and the drawer reads fine without it.

## Build split

One PR each, in order, red, green and refactor as separate commits.

1. **Flat research** (new ticket). `Research.pains` becomes a list of pain points with an id and text, `hearing` holds every quote, and pain points, quotes and ideas each get an id, so edits and Undo name what they change. The invented sample research moves to the new shape, keeping every quote. The drawer's quotes become the first five, in order. The task view's read sections show pain points as a bulleted list and every quote under "What we're hearing", without "Heard, but not yet placed under a pain point". Scope: `packages/core/src/domain/map/story-map.ts`, `adapters/in-memory/sample-research.ts`, `application/get-map-view.ts`, `apps/web/src/features/map/research.ts`, `research-section.tsx`, `apps/web/src/features/task-view/model.ts`, `sections.tsx`. Tests: `research.app.test.ts`, `get-map-view.app.test.ts`, `get-task-view.app.test.ts`, `move.unit.test.ts`, `research.unit.test.ts`, `subject.unit.test.ts`, `task-view.unit.test.ts`.
2. **Research commands** (new ticket). A new `application/edit-research.ts` for a task, subtask or step:
   - set the summary
   - add, edit and remove a pain point
   - add, edit and remove a quote
   - add, edit and remove an idea

   Text is trimmed, empty text is refused, and a quote needs words and a participant. Each returns the map before and after, for `undoChange`. Scope: `packages/core/src/application/`, `index.ts`. Tests: new `edit-research.app.test.ts`. After 1.

3. **Record research in the task view** (new ticket). The section above replaces the read-only research in `/task/[id]`, with server actions for each command and the existing Undo toast. The repeat check is a pure function in its own file. Scope: `apps/web/src/features/task-view/`, `apps/web/src/app/task/`. Tests: new `repeats.unit.test.ts` (overlap, stopwords, endings, the three-word floor, the threshold). After 2. Design pass (`emil-ui-review`, `emil-unslop-design`) and a check at 375 px before it lands.

## Questions for Scott

1. **Order of pain points and quotes.** The drawer leads with "What we're hearing", and this section leads with pain points. Recommendation: keep pain points first here, because the problem reads first and the voices back it up, and leave the drawer alone, where folds with counts make order matter less. Or match the drawer in both.
2. **Is a participant label required on a quote?** Recommendation: yes. It's what keeps a quote anonymous yet attributable, such as "P3, mechanic", and a quote without one reads as invented. Or make it optional.
