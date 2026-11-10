# Decision: setting a light with a review

Decided by Scott on 2026-11-05, from a live prototype on the invented sample map.

**The need:** a team should be able to change a task's light quickly and type a simple review. Scott's call: structured evidence needs more thought and is a later iteration, most likely with AI parsing research such as interview transcripts and adding it automatically.

**Chosen: Light then review.**

- Picking a light turns the drawer into a short form with a Review box. The map keeps the old light until the change is set.
- "Set to yellow" commits it. Cmd or Ctrl+Enter does the same. Cancel or Esc abandons it.
- Clicking the current light opens the same form with "Save review", to update the reasoning alone.
- Green, yellow and red need a review. Grey and out of scope don't.
- Only the latest review is kept. Superseded on 2026-11-10: every change is kept as a log (`docs/designs/task-view-direction.md`).
- An unfinished review stays with its task if you switch rows, until you set or cancel it.
- A task with subtasks has no picker. Its light follows from its subtasks, so the drawer lists them, and each one opens its own drawer.

The review is stored as a new kind of evidence, a note, so the gate stays in place and structured evidence can sit alongside it later. See `docs/product/rating-model.md`.

**Rejected:**

- **Instant** (a click changes the map, and a review is optional). The quickest, but colours can change with no reason, and a stray click changes the map.
- **Review log** (every review is kept and dated). Closest to a permanent record, and could return with AI-added research, but the drawer grows over time and tasks would need many ratings rather than one.
- **Evidence first and Light first with structured evidence forms.** From the first round of this prototype. Too much to fill in for now.

**Known cost:** one step more than Instant, and each new review replaces the last.

**Still working under interim assumptions** in `docs/agents/open-conflicts.md`: a mixed parent is fixed at yellow with no override (entry 9), and anything unrated shows as grey (entry 11).

# Decision: tying the review to its light

Decided by Scott on 2026-11-10, from a live prototype on the invented sample map, with a task's research under the light.

**The problem:** the light's meaning and its review sat under the picker at the same spacing as everything else, and the review was set like the research summary under it. It didn't read as the reason for that light.

**Chosen: Bubble.** The meaning and the review (or the review form) sit in one `sunken` panel, 12 px inside, with a small notch on its top edge pointing at the picked light. The notch slides to a newly picked light in 150 ms. The task view gets the same panel, because it uses the same `RatingSection`.

**Rejected:**

- **Labelled.** "Light" and "Review" as rows of the Who and Team list. Tidy, but the review gets the narrowest column in the drawer, and a long one runs tall.
- **Thread.** A rule in the light's colour down the side of the meaning and review. Quiet, but colour is the only tie, and grey and out of scope barely differ.
- **Statement.** At rest, the light's name with its reasons under it, and the picker behind Change. Reads best, but setting a light takes one more click and the picker is hidden.

**Known cost:** the panel is the heaviest block in the drawer, and the only filled one.
