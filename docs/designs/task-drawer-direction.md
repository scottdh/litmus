# Decision: the task drawer, and renaming

Decided by Scott on 2026-11-05, from a live prototype with three working directions on the invented sample map.

**The need:** names on the map need editing. Each task will also need its own drawer for more information, and tasks will later be dragged to reorder them. So a row has to carry several interactions without crowding a surface that's mostly read.

**Chosen: Card.** Rename is the first thing the task drawer does, not a feature of its own.

What a row does:

- Click: opens the drawer. Clicking another row switches to it.
- Chevron and mix bar: expand subtasks. This replaces the whole row expanding.
- Press and move: drags the task. Reserved for later, and it doesn't conflict with click.

In the drawer:

- The name is a field, focused on opening but not selected, so a stray key can't overwrite it.
- Enter saves and closes. Esc restores the old name and closes. Leaving the field saves. An empty name can't be saved.
- A parent task says its light is set by its subtasks.

Chapters:

- A chapter's click is taken by focus, so a Rename action opens the same drawer, with the name selected.
- Chapters on rails can't be renamed until they're focused.

The drawer sits beside the story rather than over it, below the header and toolbar. That keeps the light controls reachable and means opening it doesn't move the page vertically. On a phone it fills the screen.

**Rejected:**

- **Edit mode** (a toolbar button turns every name into a field). The best for bulk renaming, but fields capture press-and-move, so dragging would need handles, and names would be edited apart from everything else in the drawer. It could return as a wider "Edit map" mode if bulk work hurts.
- **Inline** (a pencil on hover turns the name into a field in place). The quickest for one typo, but each row would carry a pencil, drag handle, mix bar, count and chevron, and it duplicates the drawer.

**Known cost:** fixing a typo takes more steps than editing in place: click, edit, Enter.

## Build order

1. The drawer, with rename for tasks, subtasks and chapters.
2. Rating and evidence in the drawer.
3. Moving tasks.

## Moving tasks

Scott's decisions, on 2026-11-05:

1. Tasks nest two levels deep. A drop that would make three is blocked, because the parent light rule and the row layout both assume two.
2. When a task becomes a parent, its review stays in the drawer, marked as no longer driving the colour.
3. When a parent loses its last child, it becomes a plain task showing grey, which matches "unrated". Any rating from before it was a parent goes with it.

How it works:

- With a mouse, press and move a row to drag it. A line shows where it will land, and an outline shows it going inside a task. A plain click still opens the drawer. Esc cancels.
- A rail takes a drop at the end of its chapter, because its tasks aren't visible to aim between.
- The drawer has Move up, Move down and Move to, for keyboard and touch. There's no touch dragging, because it fights with scrolling.
- A visible Undo reverses the last move. It refuses if the map has changed since, rather than lose that change.
