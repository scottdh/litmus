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

- A chapter's click is taken by focus, so an Open link opens the same drawer, with the name selected. It said Rename until the team drawer outgrew the name (`teams-direction.md`, section 10).
- Chapters on rails can't be renamed until they're focused.

The drawer runs the full height of the window at the right edge, as it did in the prototype, and slides in. The page makes room for it, so the light controls stay reachable. On a phone it fills the screen.

An X at the top closes it. The prototype had a Done button under the content; Scott chose the X on 2026-11-05 when reviewing the build. Clicking it saves the name, as leaving the field does.

**Known cost of full height:** the narrower page can make the header wrap, which moves the story down when the drawer opens. Measured in the sample map: 39 px at 1024 px wide, 5.5 px at 1280 px, none at 1440 px and above. The first build avoided this by putting the drawer below the header, but Scott preferred the full-height drawer.

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

1. Tasks nest two levels deep. A drop that would make three is blocked, because the parent light rule and the row layout both assume two. Steps sit under subtasks without changing this, because they aren't tasks and take no light (`docs/designs/steps-direction.md`).
2. When a task becomes a parent, its review stays in the drawer, marked as no longer driving the colour.
3. When a parent loses its last child, it becomes a plain task showing grey, which matches "unrated". Any rating from before it was a parent goes with it.

How it works:

- With a mouse, press and move a row to drag it. A line shows where it will land, and an outline shows it going inside a task. A plain click still opens the drawer. Esc cancels.
- A rail takes a drop at the end of its chapter, because its tasks aren't visible to aim between.
- The drawer has up and down arrows beside the light, and Move to on its own line, for keyboard and touch. There's no touch dragging, because it fights with scrolling.
- A visible Undo reverses the last move. It refuses if the map has changed since, rather than lose that change.

## Follow-up: reordering with the keyboard on the map

Built in #91, after the move controls went into the drawer's More menu (#90).

- **Space picks up, the arrows carry, Enter drops, Esc puts back.** It's the pattern screen reader users already know from other reorderable lists. Space no longer opens a row's drawer; Enter still does.
- **The arrows walk the drop places, not the rows.** Every place dragging could drop the row, in reading order, so moving into a task, out to a chapter and across chapters follow dragging's rules, including the two-level limit, without a second set of rules. Left and right jump a chapter, because on a wide map up and down alone would take a long time to cross one.
- **Only what's on show.** A folded-up task takes a row only at its end, and folded chapters are skipped, because a line can't point at a row you can't see.
- **A hint in the toast's place** says where the row would land and which keys do what. Sighted keyboard users have no other way to learn Enter and Esc. The toast hides while a row is carried, because they'd sit in the same place.
- Rejected: **Alt and the arrows to move one place at a time**, with no pick-up. Quicker for one step, but it can't show where a row is going before it goes, and it can't go into a task.
