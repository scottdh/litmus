import type { ActivityView, TaskView } from '@litmus/core';

/** Picked teams are view state only: nothing about them reaches the domain. */
export type PickedTeams = ReadonlySet<string>;

/** Picked like a team, to show the tasks nobody has. It can't clash with a team id, which always starts "tm_". */
export const NO_TEAM = 'no-team';

/** Outside the picked teams. Nothing fades while none is picked, and a task with no team fades unless No team is. */
export const isOffTeam = (task: TaskView, picked: PickedTeams) =>
  picked.size > 0 && !picked.has(task.teamId ?? NO_TEAM);

/** The chapters to keep open: those holding any task of a picked team. */
export const chaptersWithTeams = (activities: ActivityView[], picked: PickedTeams) =>
  activities
    .filter((activity) => activity.tasks.some((task) => !isOffTeam(task, picked)))
    .map((activity) => activity.id);

/** With one team picked, a new task is theirs, so it doesn't fade the moment it's added. */
export const teamForNewTask = (picked: PickedTeams): string | null => {
  const only = picked.size === 1 ? [...picked][0] : undefined;
  return only === undefined || only === NO_TEAM ? null : only;
};

const TEAM_NAMES = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

/** Every team on a map with more than one, so the chip can say "All teams". */
export const isEveryTeam = (pickedCount: number, teamCount: number) => pickedCount > 1 && pickedCount === teamCount;

/** The picks that still mean something: removed teams go, and so does No team once there are no teams at all. */
export const picksStillOnMap = (picked: PickedTeams, teamIds: string[]): PickedTeams =>
  new Set([...picked].filter((id) => (id === NO_TEAM ? teamIds.length > 0 : teamIds.includes(id))));

/** The status line while teams are picked. Tasks with no team are "unowned" here, which reads better than "No team's". */
export const teamSummary = (
  { names, noTeam, allTeams }: { names: string[]; noTeam: boolean; allTeams: boolean },
  anyMatch: boolean,
) => {
  const teams = allTeams ? 'any team' : TEAM_NAMES.format(names);
  if (!anyMatch) {
    if (names.length === 0) return 'Every task has a team.';
    if (allTeams) return 'No team has tasks yet.';
    const has = `${teams} ${names.length === 1 ? 'has' : 'have'} no tasks yet`;
    return noTeam ? `${has}, and every task has a team.` : `${has}.`;
  }
  if (names.length === 0) return 'Chapters without unowned tasks are folded away.';
  return noTeam
    ? `Chapters without ${teams}’s tasks or unowned ones are folded away.`
    : `Chapters without ${teams}’s tasks are folded away.`;
};

/** "only" is said for a single team, where it's the point; for more it's noise. */
export const teamChipLabel = (names: string[], teamCount: number) => {
  if (isEveryTeam(names.length, teamCount)) return 'All teams';
  if (names.length === 1) return `${TEAM_NAMES.format(names)} only`;
  if (names.length === 2) return TEAM_NAMES.format(names);
  return `${String(names.length)} teams`;
};
