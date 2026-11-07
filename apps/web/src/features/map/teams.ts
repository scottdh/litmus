import type { ActivityView, TaskView } from '@litmus/core';

/** Picked teams are view state only: nothing about them reaches the domain. */
export type PickedTeams = ReadonlySet<string>;

/** Outside the picked teams. Nothing fades while no team is picked, and a task with no team fades once any is. */
export const isOffTeam = (task: TaskView, picked: PickedTeams) =>
  picked.size > 0 && (task.teamId === null || !picked.has(task.teamId));

/** The chapters to keep open: those holding any task of a picked team. */
export const chaptersWithTeams = (activities: ActivityView[], picked: PickedTeams) =>
  activities
    .filter((activity) => activity.tasks.some((task) => !isOffTeam(task, picked)))
    .map((activity) => activity.id);

/** With one team picked, a new task is theirs, so it doesn't fade the moment it's added. */
export const teamForNewTask = (picked: PickedTeams): string | null =>
  picked.size === 1 ? ([...picked][0] ?? null) : null;
