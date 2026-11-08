# Decision: teams, and showing one team's tasks

Decided by Scott on 2026-11-07, from a working prototype on the invented sample map. Method: built in place, then refitted to the one-row header (`docs/designs/header-direction.md`). Adding and renaming teams (section 6) followed in #37.

**The need:** each task is the responsibility of one team, whose job is to turn it from unsupported to green. A team needs to see its own work across the whole story without reading every chapter, and anyone opening a task needs to see who has it.

This settles part of open conflict 2: an earlier version of the idea assigned work to squads, and the brief didn't. Scott has now asked for teams, so they're in. Nothing else in that row changes.

## 1. Where a team lives

- **On top-level tasks only.** A task has one team or none. Its subtasks share it, because a parent's light follows from its subtasks and splitting ownership under one light would leave nobody answerable for it.
- A subtask moved out to a chapter keeps the team it was working under. A task moved in under another task takes on that task's team, because the team was only ever on the task.
- A team is a name. It has no colour, because colour on the map means a light. Picking teams in the filter never reorders tasks. Teams arrange their tasks by hand on the one shared map (`docs/product/rating-model.md`).

## 2. In the drawer

A task's or subtask's team is a quiet line under its personas, opened to change it. Section 14 has the current design; this section first described a Team row with a select.

Steps and chapters show no team.

## 3. Showing a team's tasks

- **Teams**, a quiet button just before Key, opens a popover under it, aligned to its end, 18 rem wide or the screen less 2 rem. Title "Show a team's tasks". One row per team: a checkbox, the name, and its task count in `muted` 12 px `tabular-nums`. Under a hairline: "Other tasks fade, and chapters with none of theirs fold away."
- Any number of teams can be picked. Picking one fades every task outside the picked teams, including tasks with no team, to the same 30% as dimming to a light. A task already faded for its team isn't faded again by a light.
- Chapters with none of the picked teams' tasks fold away. This sets the chapter focus, so a folded chapter can still be added back by clicking it, and the focus stays as it is if a task changes team while teams are picked, so nothing jumps while you edit.
- While teams are picked, a chip filled with `ink` in the row clears them. It says "only" for one team ("Till only ×"), where that's the point, and drops it for more, where it's noise: "Bench and Till ×", "3 teams ×", and "All teams ×" once every team is picked. The status line reads "Chapters without Bench and Till's tasks are folded away.", or "…without any team's tasks…" when every team is picked. Show the whole story clears the teams and the focus.
- With exactly one team picked, a task added to a chapter goes to that team, so it doesn't fade as it lands. It's part of the same change as the add, so Undo removes it cleanly. With two or more picked, a new task has no team.

## 4. Rejected

- **A row of team chips under the light chips.** The first prototype did this. It was the most direct, but it put a second permanent row back into the header that the header direction had just cleared. Scott preferred the team picker behind a click.
- **Teams on subtasks too.** More precise, but a parent's light would then have several owners. Reversed in section 12.
- **A colour per team.** Colour is reserved for lights.

## 5. Known costs

- The header row wraps onto two lines a little sooner, with the chip and the Teams button in it.
- Picking teams replaces any focus you'd set by hand, and clearing them clears the focus.
- Which teams are picked isn't remembered across reloads, unlike the focus.

## 6. Adding and renaming teams

Built in #37, as proposed.

- **Add team** sits at the end of the Teams popover and works like every other add: a field appears where the team will, Enter adds, Esc gives up, and the add gets the usual Undo in the row.
- **Rename** (now **Open**, see section 10) shows on each team's row in the popover, like Rename on a chapter: on hover or focus with a mouse, and always on a phone. It opens the team in the drawer, because the drawer is where names are edited. The team drawer holds the name, and lists the team's tasks under their chapters, each opening its own drawer, and adding its chapter back to the focus if it was folded. A team with no tasks says "No tasks yet. Give a task to Bench from its drawer." That makes the drawer a team's overview as well as where it's renamed.
- Esc in the Add team field ends only the field, and the popover stays open.

## 7. Build split

1. **#36, teams on tasks and the Teams popover.** `packages/core/src/domain/map/team.ts`, `packages/core/src/application/assign-team.ts`, the `teams` and `teamId` fields, the team field (since replaced by `apps/web/src/features/map/team-line.tsx`, section 14), `team-popover.tsx`, `teams.ts`, `story-wall.tsx`, `chapter.tsx`, `drawer.tsx`. Tests: `team.unit.test.ts`, `assign-team.app.test.ts`, `teams.unit.test.ts`.
2. **#37, adding and renaming teams.** Depends on 1.

## 8. Questions for Scott

1. **Removing a team.** Recommend allowing it from the team drawer, with its tasks going back to "No team" and the usual Undo. The alternative is to leave removal out until real maps need it.
2. **Finding tasks nobody has.** Recommend a "No team" row at the end of the Teams popover, so a squad can find work nobody owns. The alternative is to leave it to the drawer.
3. **Showing the team on the row.** Recommend not, because the row is reading-first and the drawer already says it. The alternative is a `muted` name under the task when no teams are picked.

## 9. Decided in #40 and built in #41 and #42

- **Removing a team** is a **Remove team** button at the foot of the team drawer, under "Its tasks stay on the map and lose their team." It first had no confirmation, because Undo brings back the team and every assignment in one step; §13 replaced that with a confirm. A removed team that was picked stops being picked, and the focus is recomputed from what's left.
- **No team** is a last row in the Teams popover, with its count and no Open. It filters like a team and shares the chip: "No team only ×" and "Till and No team ×", with the chip wording from #48 otherwise. With only No team picked, a new task gets no team.
- **The Teams button now shows with no teams.** Removing the last team would otherwise leave no way to add another. With none, the popover holds only Add team.

## 10. Open, not Rename

Decided by Scott on 2026-11-07, once the team drawer could remove a team as well as rename it.

- The link on a team's row, and on a chapter, says **Open**, and its accessible name is "Open Bench". It names where you go, not one thing you can do there, so it stays true as the drawer gains more. Personas follow when their drawer lands (#53).
- Rejected: **View**, which suggests read-only; **More**, which suggests a menu; **Details**, which suggests information rather than somewhere to act; **Manage**, which is heavier than the product's voice; and a bare **›**, which rows already use for opening subtasks.
- From the same design pass: Remove team ignores clicks while it saves, the status line calls tasks with no team "unowned" ("Chapters without Till's tasks or unowned ones are folded away."), and with no teams the popover says "No teams yet".

## 11. No team is muted, and the hairline stays

Decided by Scott on 2026-11-07, after the design pass on #59.

- The **No team** row's name is `muted`, so it reads as a different kind of row from the teams above it, not a team called "No team". Its checkbox and count are the same as every row's, and it filters the same.
- The **hairline above Remove team** stays. It sets the one destructive action apart from the fields above it.

## 12. A subtask can have a team of its own

Decided by Scott on 2026-11-07, in #61. This reverses "Teams on subtasks too" in section 4.

- **Why:** a subtask can be the responsibility of a different team from its task's. That team can then keep the task's light from changing. That's accepted: it's realistic, and it gives the task's team a reason to push the other team to prioritise at alignment sessions.
- **Following by default.** A subtask with no team of its own follows its task's, so nothing changes for maps that don't use this. Its drawer has a Team select whose first option is "Same as its task (Bench)", then each team. A subtask given its task's team follows the task, so it stays with the task if the task changes hands. There's no separate "No team" for a subtask.
- **Moving.** A subtask moved out to a chapter keeps the team it was under, its own or its task's. A task, or a subtask, moved in under a task keeps its team, unless that's the same as its new task's, in which case it follows.
- **Removing a team** leaves its subtasks following their task again.
- **Showing a team's tasks.** A task shows if it or any of its subtasks is a picked team's, and its chapter stays open. Inside a task on show, a subtask whose team isn't picked fades, as it does for an unpicked persona. Counts in the popover count a task once if it or any subtask is theirs.
- **The team drawer** lists a subtask a team has under another team's task in its task's place, with "Subtask of …" under it in `muted` 13 px. Opening it opens its task's row.
- **Adding.** With one team picked, a new subtask goes to that team too, unless it's the task's own, so it doesn't fade as it lands.
- **Not done:** the subtask's team isn't shown on the row. The drawer says it, as for tasks (question 3 in section 8).

## 13. Remove team asks first, in a popover

Decided by Scott on 2026-11-07, from a prototype of five options (#63).

- **Remove team** opens a popover on the button: "Remove Bench?", then "Its 18 tasks stay on the map and lose their team. You can undo this." It holds **Cancel** and a solid red **Remove team**, and focus starts on Cancel. Escape or Cancel closes it and leaves the drawer open. Confirming removes the team with the usual Undo.
- Why: Undo alone wasn't enough. It appears as a plain header button while the drawer closes, far from the click, and Scott never noticed it while removing teams. The confirm says Undo exists, so it's a pause, not the only safety net.
- Rejected: **Undo only**, because the Undo is too easy to miss; **inline** (the button turns into the question), easy to miss on a phone and it moves the layout; a **dialog**, too heavy for a change Undo can reverse, and it covers the map; and an **Undo toast**, which protects only if you react within about 8 seconds.
- Then, the same day (#65), it became the rule for every change: anything that loses data asks first in a popover, then gets Undo, and every other undoable change shows a toast with Undo. A confirm on adds and moves would be friction on the map's most frequent actions, and a toast alone isn't enough when data is lost, because 8 s is easy to miss. The toast is neutral, never green, because green is a light. Removing a persona follows the confirm when it's built (#53 leaves it for later).
- Still open: whether renames, team assignment and personas get Undo, and whether tasks and chapters can be archived rather than deleted. "Parking lot" is already the brief's word for gaps AI spots, so archiving shouldn't be called parking.

## 14. The team is a line under the personas

Decided by Scott on 2026-11-08, from a prototype of four directions (#85), after the persona byline (#78).

- **Why:** a team is set about once a year, and the Team row's raised select was the heaviest control at the top of the drawer.
- **Chosen, Line:** a `muted` 13 px line under the persona byline, after a small two-heads mark so it doesn't read as one more persona. A team set on the item is in `ink`; a subtask following its task reads "Bench, same as its task", all `muted`; a task with none reads "Add a team". Otherwise it ends with the persona byline's chevron, so it reads as tappable on a phone. It opens a pick-one list titled "Team" that saves and closes on a pick. `DESIGN.md` (TeamLine) has the detail.
- **Rejected:** the **Team row** as it was, too heavy for its use; **Who**, one byline and one popover for team and personas together, which made a long popover on a phone and put personas a click further away; and **Footer**, a sentence at the foot of the drawer with Change, the quietest but the hardest to find, with "Pick a team" at the very bottom for a new task.
- **Known cost:** on desktop the line is 29 px tall, under the 40 px target, like the persona byline. It can't grow without its tap area overlapping the persona line 4 px above. On a phone both are 44 px.
