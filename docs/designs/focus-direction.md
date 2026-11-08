# Decision: chapter focus

Decided by Scott on 2026-11-05, from a live prototype with three working directions on the invented sample map.

**The need:** a squad is largely responsible for the tasks in certain activities. They focus on those, and the others recede, but every chapter name stays legible so they can add it to the focus.

**Chosen: Rails.** Background chapters collapse to narrow strips showing only the chapter number and name. Focused chapters keep their full width, so non-adjacent chapters fit on one screen.

- Click a chapter name to focus it. Click anywhere on another chapter to add it. Click a focused chapter's name to remove it.
- "Show the whole story" or Esc clears the focus.
- Chapters stay in story order, however they were picked.
- Tasks and health are hidden on rails. Scott's call: the team should see only their own tasks and task health, and only needs chapter names for the rest.
- Rails are 116 px, with the name in `font-story` at 17 px and `muted`, turning `ink` on hover. Since #88 they're 56 px with the name on its side; see Width while focusing.
- The transition is 240 ms, `cubic-bezier(0.32, 0.72, 0, 1)`. These are the prototype's starting values. Scott didn't tune them.
- Focus is view state, remembered per map in that browser. There's no domain concept of a squad yet.
- Light dimming and Expand all apply inside the focus.

**Rejected:**

- **Depth** (columns stay in place, shrink 5% and fade to greyscale). The most stable layout, but focused chapters gain no room, so non-adjacent chapters can still sit off-screen.
- **Pull forward** (background columns shrink to 66% and fade, focused columns widen to 384 px). The most literal "receding", but task text rewraps as columns widen, and it's the busiest to watch.

**On a phone** the columns stack, so background chapters collapse to their name in place in the stack. The prototype was desktop only, so this was built first and then confirmed by Scott after trying it.

**Later, if the interaction holds up:** named squads that own chapters, which would add a concept to the domain.

## Width while focusing

Decided by Scott on 2026-11-08, from two rounds of live prototypes on the invented sample map (#88).

**The need:** a squad focuses on one to three chapters, and those kept their 272 px width, so the width the rails gave up went nowhere. Long task names wrapped, and longer chapters ran off the screen.

**Chosen: Ledger.**

- While focusing, rails are 56 px: the chapter number, and under it the name set on its side, reading top to bottom. At 116 px, seven rails left almost nothing to give away on a nine-chapter map.
- Focused chapters split what the rails leave, between 272 px and 600 px each. The cap keeps lines short enough to read. With the sample map on a 1440 px screen, two focused chapters are about 500 px.
- The widths come from CSS alone: the story is a size container, and the wall tells it how many chapters are focused and how many are rails. Opening the drawer narrows them with no script.
- The column still animates with `--motion-focus`. Its text box snaps to its final width at the start, so text rewraps once, not on every frame.
- Where a chapter's task column is at least 384 px, a task's mix bar and subtask count sit at the end of the name's line, so each task is one row. Narrower columns, at rest, with three or more chapters focused on a small screen, or on a phone, keep the count under the name. This came out of the polish pass: with three focused chapters Ledger squeezed names into two lines beside the count.
- On desktop nothing changes with no focus. On a phone the column is under 384 px, so nothing changes there either. On a tablet, where chapters stack at full width, rows are one line at rest too, because the rule follows the column's room, not the focus.
- Touch has no hover, so a row also fills while it's pressed, and the browser's grey tap flash is off app-wide (`-webkit-tap-highlight-color` in `globals.css`).

**Rejected:**

- **Today** (focused chapters keep 272 px). No gain.
- **Fill** (wider columns, the count under the name). The second line under every parent task costs height that the width could save.
- **Columns** (the task list flows into newspaper columns). Most tasks on screen, but story order runs down and then across inside a chapter, and expanding a task unbalances the columns.
- **Wrap** (the count drops under the name, row by row, when the name doesn't fit). The count moves from row to row, so it can't be scanned.
- **Tight** (8 px less padding, the count as a bare number). Rows near the 32 px target floor, and a bare number needs the bar and chevron to explain it.
- **Gutter** (health in a fixed right column). Looked the same as Ledger, because the counts are already the same width.
