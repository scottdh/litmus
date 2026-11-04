# Decision: wall direction

Decided by Scott on 2026-11-04, from a live prototype with three working directions, on invented worst-case content, including subtasks.

**Chosen: Story.** Reading first, editorial.

- Activities are chapters, left to right, with a serif heading: Newsreader at 28 px, line height 1.1.
- Interface text is Instrument Sans. Tasks are 15 px, line height 1.35; subtasks are 14 px.
- Tasks are rows divided by hairlines, with a glyph that fills up with the level of support. Colour stays small and recessive.
- Each activity has a thin stacked bar beneath its heading.
- Subtasks are an indented outline with no fill, like sub-clauses. Parents show a small mix bar and a count.
- Names are never truncated, so there's no need for a "read in full" control.

**Rejected:**

- **Strips** (colour-filled tiles, nine columns on one screen). The best at-a-glance read, but it gets loud with subtasks open, cuts off long names, and reads less like a story. It's the first candidate for the dense view below.
- **Line** (a continuous journey line with branch lines for subtasks). The most literal hierarchy, but it has the most visual machinery per task and the smallest subtask text.

**Known cost:** Story's data density is low. Scott's call is that this gets a separate dedicated view later, rather than compromising this one. That view gets its own design when the mode it serves is clear.
