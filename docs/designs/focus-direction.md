# Decision: chapter focus

Decided by Scott on 2026-11-05, from a live prototype with three working directions on the invented sample map.

**The need:** a squad is largely responsible for the tasks in certain activities. They focus on those, and the others recede, but every chapter name stays legible so they can add it to the focus.

**Chosen: Rails.** Background chapters collapse to narrow strips showing only the chapter number and name. Focused chapters keep their full width, so non-adjacent chapters fit on one screen.

- Click a chapter name to focus it. Click anywhere on another chapter to add it. Click a focused chapter's name to remove it.
- "Show the whole story" or Esc clears the focus.
- Chapters stay in story order, however they were picked.
- Tasks and health are hidden on rails. Scott's call: the team should see only their own tasks and task health, and only needs chapter names for the rest.
- Rails are 116 px, with the name in `font-story` at 17 px and `muted`, turning `ink` on hover.
- The transition is 240 ms, `cubic-bezier(0.32, 0.72, 0, 1)`. These are the prototype's starting values. Scott didn't tune them.
- Focus is view state, remembered per map in that browser. There's no domain concept of a squad yet.
- Light dimming and Expand all apply inside the focus.

**Rejected:**

- **Depth** (columns stay in place, shrink 5% and fade to greyscale). The most stable layout, but focused chapters gain no room, so non-adjacent chapters can still sit off-screen.
- **Pull forward** (background columns shrink to 66% and fade, focused columns widen to 384 px). The most literal "receding", but task text rewraps as columns widen, and it's the busiest to watch.

**Not decided by Scott, assumed in the build:** on a phone the columns stack, so background chapters collapse to their name in place in the stack. The prototype was desktop only.

**Later, if the interaction holds up:** named squads that own chapters, which would add a concept to the domain.
