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

const TEAM_NAMES = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

/** Every team on a map with more than one, so the chip can say "All teams". */
export const isEveryTeam = (pickedCount: number, teamCount: number) => pickedCount > 1 && pickedCount === teamCount;

/** "only" is said for a single team, where it's the point; for more it's noise. */
export const teamChipLabel = (names: string[], teamCount: number) => {
  if (isEveryTeam(names.length, teamCount)) return 'All teams';
  if (names.length === 1) return `${TEAM_NAMES.format(names)} only`;
  if (names.length === 2) return TEAM_NAMES.format(names);
  return `${String(names.length)} teams`;
};
