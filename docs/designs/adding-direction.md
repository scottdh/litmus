# Decision: adding tasks, subtasks and chapters

Built on 2026-11-05 at Scott's request, without a prototype round, because the pattern is conventional. Everything here is open to change once he's used it.

**The need:** a map could be edited but not grown, so a story couldn't be built on the wall.

How it works:

- **Task:** every chapter ends in Add task. It's always visible, because hover-only controls fail on touch. Enter adds and clears the field for the next, so a chapter can be typed out in one go. Enter on an empty field or Esc finishes. Leaving the field adds anything typed.
- **Subtask:** Add subtask in a task's drawer, working the same way. It isn't on subtasks, because tasks nest two levels at most.
- **Chapter:** Add chapter ends the story, and a chapter's drawer has Add chapter before and after, because chapters can't be moved yet and narrative order matters. Enter adds it and goes straight to its first task. If a focus is on, the new chapter joins it, otherwise it would land on a rail where it can't take tasks.
- **Mistakes:** the latest add has the same Undo as a move, because nothing can be deleted yet.

New tasks go at the end of their list, and dragging puts them anywhere else. They have no rating, so they show grey.

**Rejected:** saving a placeholder like "New task" and opening the drawer to name it. It reuses the drawer, but abandoning it leaves junk on the map, and it's too slow for typing out a story.

**Known costs:**

- Add chapter is at the far end of a long story.
- Switching windows mid-name adds what's typed so far.
