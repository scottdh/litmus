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

## Open for Scott, before moving tasks

Recommendations first.

1. How deep can tasks nest? Keep two levels, and block a drop that would make three, because the parent light rule and the row layout both assume two.
2. What happens to a task's rating when it becomes a parent? Keep its evidence in the drawer, marked as no longer driving the colour.
3. What happens when a parent loses its last child? It becomes a plain task showing grey, which matches "unrated".

Moving also needs a visible undo, because a wall that's mostly read shouldn't lose a task's place to a stray drag, and a "Move to…" control in the drawer for keyboard and touch.
