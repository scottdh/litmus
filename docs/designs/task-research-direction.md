# Decision: research in the task drawer

Decided by Scott on 2026-11-09, from a live prototype with three working directions on the invented sample map (branch `proto/task-drawer-research-90`, #90).

**The need:** the drawer said what a task is called and how it's rated, but not what users go through. Anyone opening it should come away with three things: what the task is, what problems users have with it, and ideas for doing better. In more complex domains, a task's name alone doesn't give enough context.

**Chosen: Folded.** The summary is always open. The other sections fold behind a row with a title and a count.

What the drawer holds, in order:

1. The name, the personas and the team, then the light (16 px under the team, because the light reads with them).
2. **Summary.** One to four sentences, distilled from research. Always open.
3. **What we're hearing.** Up to five quotes from users talking about this task. Each quote shows its persona's glyph and a participant label, such as "P3, mechanic".
4. **Pain points.** Up to five, distilled from research.
5. **How might we better support this task?** Up to five ideas. The question says "subtask" or "step" when the drawer shows one.
6. Subtasks, or a subtask's steps, with Add. This row folds as well.

A folded row is 44 px, runs the full width of the drawer between hairlines, and on hover fills that whole band. Closed panels stay in the layout so find-in-page can open them, so their padding sits inside the panel. Otherwise a closed row would leave a gap.

Rules:

- **The drawer is read-only for research.** Research is recorded in the dedicated task view, which comes later.
- **Tasks, subtasks and steps each have their own research.** Nothing rolls up. A parent shows only its own.
- **A section with nothing in it is hidden.** With no research at all, one line says "No research on this task yet."
- **A quote from research isn't rating evidence.** It doesn't back the light (`docs/product/rating-model.md`).
- **The drawer shows at most five items per section.** The task view will hold the rest.

The move arrows and Move to are now in a More menu, opened by the dots beside the X. Dragging is how people actually reorder. The arrows and Move to stay reachable there for keyboard and touch. Reordering with the keyboard on the map itself would be better, and has its own ticket (#91).

**Rejected:**

- **Open** (every section open, then subtasks). The most direct, but with full research the drawer runs to about 1,900 px on "Check parts in stock". The subtasks, the structure people came for, end up far down.
- **Tabs** (Research and Subtasks as two views under the light). Neither pushes the other off screen. But only one shows at a time, research and structure aren't two views of the same thing, and "Research" is one more word to learn.

## Later

- **The task view.** Every quote, pain point and idea, how the task is supported today, and the history of its light, with notes. The drawer gets its "Open task view" link when that page exists. Decided on 2026-11-10: `docs/designs/task-view-direction.md`.
- **Research added by AI, marked unread.** Exploration suggests AI sorts research to the right tasks reliably. Scott may loosen "AI suggestions never commit themselves", so that AI writes research straight away and it shows as unread until a team member reads it. This isn't decided. Until it is, `docs/product/rating-model.md` and the invariant in `AGENTS.md` stand.
