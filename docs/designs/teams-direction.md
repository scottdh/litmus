# Decision: teams, and showing one team's tasks

Decided by Scott on 2026-11-07, from a working prototype on the invented sample map. Method: built in place, then refitted to the one-row header (`docs/designs/header-direction.md`). Adding and renaming teams (section 6) followed in #37.

**The need:** each task is the responsibility of one team, whose job is to turn it from unsupported to green. A team needs to see its own work across the whole story without reading every chapter, and anyone opening a task needs to see who has it.

This settles part of open conflict 2: an earlier version of the idea assigned work to squads, and the brief didn't. Scott has now asked for teams, so they're in. Nothing else in that row changes.

## 1. Where a team lives

- **On top-level tasks only.** A task has one team or none. Its subtasks share it, because a parent's light follows from its subtasks and splitting ownership under one light would leave nobody answerable for it.
- A subtask moved out to a chapter keeps the team it was working under. A task moved in under another task takes on that task's team, because the team was only ever on the task.
- A team is a name. It has no colour, because colour on the map means a light. Picking teams in the filter never reorders tasks. Teams arrange their tasks by hand on the one shared map (`docs/product/rating-model.md`).

## 2. In the drawer

A task's drawer has a **Team** row under the name: the label "Team" in `muted` 13 px, and a select on the right with "No team" and each team. A change saves at once and shows at once. If it fails, the old team comes back with "That team couldn't be saved, so it hasn't changed."

A subtask's drawer shows the same row read-only: the team's name, and "Set on its task" under it in `muted` 13 px. Steps and chapters show no team.

## 3. Showing a team's tasks

- **Teams**, a quiet button just before Key, opens a popover under it, aligned to its end, 18 rem wide or the screen less 2 rem. Title "Show a team's tasks". One row per team: a checkbox, the name, and its task count in `muted` 12 px `tabular-nums`. Under a hairline: "Other tasks fade, and chapters with none of theirs fold away."
- Any number of teams can be picked. Picking one fades every task outside the picked teams, including tasks with no team, to the same 30% as dimming to a light. A task already faded for its team isn't faded again by a light.
- Chapters with none of the picked teams' tasks fold away. This sets the chapter focus, so a folded chapter can still be added back by clicking it, and the focus stays as it is if a task changes team while teams are picked, so nothing jumps while you edit.
- While teams are picked, a chip filled with `ink` in the row clears them. It says "only" for one team ("Till only ×"), where that's the point, and drops it for more, where it's noise: "Bench and Till ×", "3 teams ×", and "All teams ×" once every team is picked. The status line reads "Chapters without Bench and Till's tasks are folded away.", or "…without any team's tasks…" when every team is picked. Show the whole story clears the teams and the focus.
- With exactly one team picked, a task added to a chapter goes to that team, so it doesn't fade as it lands. It's part of the same change as the add, so Undo removes it cleanly. With two or more picked, a new task has no team.

## 4. Rejected

- **A row of team chips under the light chips.** The first prototype did this. It was the most direct, but it put a second permanent row back into the header that the header direction had just cleared. Scott preferred the team picker behind a click.
- **Teams on subtasks too.** More precise, but a parent's light would then have several owners.
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

1. **#36, teams on tasks and the Teams popover.** `packages/core/src/domain/map/team.ts`, `packages/core/src/application/assign-team.ts`, the `teams` and `teamId` fields, `apps/web/src/features/map/team-field.tsx`, `team-popover.tsx`, `teams.ts`, `story-wall.tsx`, `chapter.tsx`, `drawer.tsx`. Tests: `team.unit.test.ts`, `assign-team.app.test.ts`, `teams.unit.test.ts`.
2. **#37, adding and renaming teams.** Depends on 1.

## 8. Questions for Scott

1. **Removing a team.** Recommend allowing it from the team drawer, with its tasks going back to "No team" and the usual Undo. The alternative is to leave removal out until real maps need it.
2. **Finding tasks nobody has.** Recommend a "No team" row at the end of the Teams popover, so a squad can find work nobody owns. The alternative is to leave it to the drawer.
3. **Showing the team on the row.** Recommend not, because the row is reading-first and the drawer already says it. The alternative is a `muted` name under the task when no teams are picked.

## 9. Decided in #40 and built in #41 and #42

- **Removing a team** is a **Remove team** button at the foot of the team drawer, under "Its tasks stay on the map and lose their team." It has no confirmation, because Undo brings back the team and every assignment in one step. A removed team that was picked stops being picked, and the focus is recomputed from what's left.
- **No team** is a last row in the Teams popover, with its count and no Open. It filters like a team and shares the chip: "No team only ×" and "Till and No team ×", with the chip wording from #48 otherwise. With only No team picked, a new task gets no team.
- **The Teams button now shows with no teams.** Removing the last team would otherwise leave no way to add another. With none, the popover holds only Add team.

## 10. Open, not Rename

Decided by Scott on 2026-11-07, once the team drawer could remove a team as well as rename it.

- The link on a team's row, and on a chapter, says **Open**, and its accessible name is "Open Bench". It names where you go, not one thing you can do there, so it stays true as the drawer gains more. Personas follow when their drawer lands (#53).
- Rejected: **View**, which suggests read-only; **More**, which suggests a menu; **Details**, which suggests information rather than somewhere to act; **Manage**, which is heavier than the product's voice; and a bare **›**, which rows already use for opening subtasks.
- From the same design pass: Remove team ignores clicks while it saves, the status line calls tasks with no team "unowned" ("Chapters without Till's tasks or unowned ones are folded away."), and with no teams the popover says "No teams yet".
