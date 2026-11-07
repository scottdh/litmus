# Decision: personas, and showing one persona's tasks

Decided by Scott on 2026-11-07: the design as proposed, with all five questions in section 8 settled as recommended. It came from a working prototype on the invented sample map (branch `proto/personas`, built in place on the one-row header). Method: prototyped against the teams pattern (`docs/designs/teams-direction.md`), checked in the browser, then written up here. The `emil-ui-review` and `emil-unslop-design` passes haven't been run yet.

## 1. Goals

**The need:** one or more user personas carry out each task. Anyone reading the map should see who does a task without opening it, and a squad should be able to pull out everything one persona does across the whole story. The brief already says task cards carry personas (`docs/product/brief.md`), and nothing on the map shows them yet.

**Success:** you can tell personas apart at a glance on a row, on any OS. Picking a persona shows its tasks in place, and the rest of the story stays where it is. You can see where a persona's work sits inside a task, not only that it's in there somewhere.

**What must stay:** colour means a light and nothing else. Tasks stay in narrative order, and picking never reorders them. The row stays reading-first. Lights are still graded per task, not per persona.

This doesn't settle open conflict 6 (persona × task × surface). Personas here say who does a task. They don't split its light. The interim assumption, grading task × product, holds.

## 2. Critique of what's there now

Nothing exists for personas. The nearest pattern is teams. A task has one team, set on the top-level task only (`packages/core/src/domain/map/team.ts`), and you pick teams in a popover that fades and folds (`apps/web/src/features/map/team-popover.tsx`, `teams.ts`). Personas differ in three ways, and these shape the design:

- A task can have **several** personas, not one.
- Personas can be set on **subtasks and steps** as well, and they roll up.
- A persona needs to be **recognisable on the row**. A team only has to be in the drawer (teams direction, question 3).

## 3. Options

**A. Line icons drawn for Litmus, one colour, trailing the name (recommended, prototyped).** Eight glyphs on a 16 px grid in the same stroke weight. They render the same everywhere, sit quietly with `LightMark`, and stay legible at 14 px.

**B. Emoji.** Rejected. You suggested emoji might be enough, and they do vary a lot, but they render differently on each OS and font. They're also full colour, which breaks the rule that colour means a light.

**C. Initials in a small badge.** Rejected. Two personas often share an initial (Owner and Operator, say), and a row of letter badges reads like tags or avatars rather than roles.

For where the icons go, a second row of icons under the name was also tried in thought and rejected: it makes every row taller, even rows with one persona.

## 4. The design

### 4.1 Where a persona lives

- A map has a list of **personas**, each with a name and an icon. Unlike teams, an icon is required, because the row shows the icon and not the name.
- **Any number** of personas can be set on a task, a subtask or a step. Chapters take none.
- **Roll-up:** a subtask shows its own personas plus its steps'. A task shows its own plus its subtasks' (which already include their steps'). The view works this out (`packages/core/src/application/get-map-view.ts`), and it's never saved. So removing a persona from a step takes it off the parent too, unless the parent has it set itself.
- Rolled-up personas are listed in the map's persona order, not in the order they were set, so a row's icons don't shuffle as you edit.
- Moving a task carries its own personas with it, including when a subtask becomes a task or a task becomes a subtask (`move.ts`).

### 4.2 The icons

`apps/web/src/features/map/persona-icon.tsx`. A fixed set: `person`, `wrench`, `bell`, `box`, `key`, `house`, `phone`, `star`. 16 px viewBox, 1.4 stroke, round caps and joins, `currentColor`. Each has a `<title>` and `aria-label` with the persona's name, so hovering shows the name and screen readers say it.

The sample uses Rider (person), Front desk (bell), Mechanic (wrench), Stock keeper (box) and Owner (key).

### 4.3 On the row

- The icons follow the name inline, 14 px, 4 px apart, 6 px after the name's last word, nudged down 0.15 em to sit on the text. They stay together on one line and wrap with the last word, so they never end up on a line by themselves.
- `muted` at rest. While personas are picked, the picked personas' icons draw in `ink` and the rest stay `muted`.
- Task rows show the roll-up. Subtask rows show their own plus their steps'. Step rows show their own.

### 4.4 In the drawer

`apps/web/src/features/map/persona-field.tsx`. Under Team for tasks and subtasks, and under the name for steps:

- The label "Personas" in `muted` 13 px.
- One toggle button per persona, wrapping: the icon, then the name, 13 px medium, 32 px tall (44 px on a phone). When it's on, it's filled with `ink` and the text is `canvas`. When it's off, it's `muted` with `shadow-raised`. Each click saves straight away and shows at once. If the save fails, the button goes back and this appears: "That persona couldn't be saved, so it hasn't changed."
- Under the buttons, in `muted` 13 px: "Also from its subtasks:" (on a task) or "Also from its steps:" (on a subtask). Then each rolled-up persona that isn't set here, with its icon and name in `ink`. These aren't buttons, because they're set further down. Steps have nothing beneath them, so they show no such line.
- In the drawer, the lists of subtasks and steps show each child's icons after its name.

### 4.5 Showing a persona's tasks

`apps/web/src/features/map/persona-popover.tsx`, with the logic in `personas.ts`.

- **Personas**, a quiet button between Teams and Key, opens a popover under it, aligned to its end, 18 rem wide or the screen less 2 rem. The title is "Show a persona's tasks". There's one row per persona: a checkbox, the icon (16 px, `muted`), the name, and its task count in `muted` 12 px `tabular-nums`. A task counts if its roll-up includes the persona. Under a hairline: "A task counts if it, or any of its subtasks or steps, is theirs. Other tasks fade, and chapters with none of theirs fold away."
- Any number can be picked. A task fades to 30% unless its roll-up includes a picked persona.
- **Inside a task that's on show,** a subtask or step fades if it has personas and none of them are picked. One with no personas follows its parent and stays on show. So in Check parts in stock, picking Front desk leaves just the one subtask whose step involves Front desk on show. Anything already faded as a whole isn't faded again.
- Chapters with none of the picked personas' tasks fold away. This sets the chapter focus, exactly as teams do.
- While personas are picked, a chip filled with `ink` shows the picked icons and "Front desk only ×", or "3 personas only ×" from three on. The status line reads "Chapters without Front desk's tasks are folded away."
- **With teams:** picking both shows only tasks that match both. The status line reads "Chapters without Bench's tasks for Mechanic are folded away." If nothing matches: "No tasks for Bench and Mechanic yet." Clearing either chip folds again by what's left. Show the whole story clears both.

### 4.6 At 375 px and in dark mode

Same as teams: the popover goes full width less 2 rem, toggle buttons are 44 px tall, and the drawer fills the screen. The icons use `currentColor` on theme tokens, so dark mode needs nothing extra. I haven't checked either in the browser yet.

## 5. States

- **No personas on the map:** no Personas button and no Personas row in the drawer.
- **A persona with no tasks:** its row shows "0 tasks". Picking it folds every chapter and the status line says "No tasks for Owner yet."
- **A task with no personas:** no icons on its row. It fades as soon as any persona is picked.
- **A save fails:** the button goes back, with the message in 4.4.

## 6. What it needs from outside

- **Adding, renaming and choosing icons for personas.** Settled in section 8, question 1. The prototype only has the sample's personas.
- **Removing a persona.** Settled in section 9.
- **Whether the icon set is the right eight.** The glyphs were chosen to fit the invented workshop. A real map will need others, so the set will grow.

## 7. Build split

1. **Personas on tasks, subtasks and steps, with roll-up.** `story-map.ts` (`Persona`, `PersonaId`, `PERSONA_ICONS`, `personaIds`, `personas`), `domain/map/persona.ts` (`setPersona`), `application/set-persona.ts`, `get-map-view.ts`, `move.ts`, `team.ts` (unassigning a team must keep personas), the sample, the server action. Tests: `persona.unit.test.ts`, `set-persona.app.test.ts`, roll-up cases in `get-map-view.app.test.ts`, carrying personas in `move.unit.test.ts`.
2. **Icons on rows and the drawer field.** `persona-icon.tsx`, `persona-field.tsx`, `chapter.tsx`, `drawer.tsx`, `subject.ts`. Tests: `subject.unit.test.ts`. Depends on 1.
3. **The Personas popover and filter.** `persona-popover.tsx`, `personas.ts`, `story-wall.tsx`, `add.ts` (a new task takes the one picked persona). Esc in the popover only closes it (question 5), and the same fix goes to `team-popover.tsx` if Teams has the bug. Tests: `personas.unit.test.ts` (which tasks fade, which subtasks and steps fade, combining with teams, which chapters stay, the persona a new task takes). Depends on 2.
4. **Adding, renaming and re-iconing personas, and the persona drawer.** `persona.ts` (`addPersona`, `renamePersona`, `setPersonaIcon`), `persona-popover.tsx`, `drawer.tsx`, `subject.ts`. Depends on 3.

The prototype has no new tests. It only updated existing fixtures for the new fields. Each PR above starts red.

## 8. Decisions

Scott agreed with all five recommendations on 2026-11-07.

1. **Managing personas.** Add persona goes at the end of the Personas popover. It works like every other add, and the new persona gets the next unused icon. Open shows on each row, as it does for teams, and opens a **persona drawer**. The drawer holds the name, an icon picker showing the eight glyphs as a single-choice row, and the persona's tasks under their chapters. As in the team drawer, each task opens its own drawer, and opening one adds its chapter back to the focus if it was folded. A persona with no tasks says "No tasks yet. Give a task to Owner from its drawer." That makes the drawer a persona's overview as well as where it's edited. Rejected: keeping personas fixed per map.
2. **Icons on subtask and step rows.** They stay, because they're what lets the filter show where in a task a persona comes in. Rejected: icons on task rows only.
3. **Subtasks and steps with no personas.** They follow their parent when filtering and show no icon. Rejected: taking on the parent's personas downwards, which blurs what was actually set.
4. **New tasks while one persona is picked.** A task added to a chapter takes the picked persona, as part of the same change as the add, so Undo removes both. With two or more picked, or with none, a new task has no personas. If one team is picked as well, it takes both.
5. **Esc while the popover is open.** Esc closes the popover and nothing else. The picks and the chapter focus stay. If Teams has the same bug, it gets the same fix.

## 9. Removing a persona

Built in #68, following Remove team and the rule for changes that lose data (teams direction, section 13).

- The persona drawer ends with a hairline and **Remove persona**, under "It comes off every task, subtask and step it's on." The button asks first, in the same popover as Remove team: "Remove Rider?", then "It comes off 9 tasks, which stay on the map. You can undo this." Cancel is focused.
- The count is the Personas popover's: a task counts if it, or any of its subtasks or steps, has the persona. So it matches the popover and the drawer's list. Counting every item it's set on directly was rejected, because that number appears nowhere else.
- Confirming takes the persona off the map and off every task, subtask and step, in one change, closes the drawer and shows the Undo toast. Undo brings it all back. A removed persona that was picked stops being picked.
