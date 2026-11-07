import type { ActivityView, TaskView } from '@litmus/core';
import { isOffTeam, type PickedTeams } from './teams';

/** Picked personas are view state only: nothing about them reaches the domain. */
export type PickedPersonas = ReadonlySet<string>;

const carries = (ids: string[], picked: PickedPersonas) => ids.some((id) => picked.has(id));

/** Nothing fades while no persona is picked. A task fades once none of its own or rolled-up personas are picked. */
export const isOffPersona = (task: TaskView, picked: PickedPersonas) =>
  picked.size > 0 && !carries(task.personaIds, picked);

/**
 * A subtask or step inside a task that's on show. One with no personas follows its parent, so it stays.
 * One whose personas are all unpicked fades.
 */
export const isChildOffPersona = (ids: string[], picked: PickedPersonas) =>
  picked.size > 0 && ids.length > 0 && !carries(ids, picked);

/** Outside the picked teams or the picked personas. Both have to match while both are picked. */
export const isOffPick = (task: TaskView, teams: PickedTeams, personas: PickedPersonas) =>
  isOffTeam(task, teams) || isOffPersona(task, personas);

/** The chapters to keep open: those holding any task that matches every pick. */
export const chaptersWithPicks = (activities: ActivityView[], teams: PickedTeams, personas: PickedPersonas) =>
  activities
    .filter((activity) => activity.tasks.some((task) => !isOffPick(task, teams, personas)))
    .map((activity) => activity.id);

/** A task counts if it, or any of its subtasks or steps, is theirs. */
export const personaTaskCount = (activities: ActivityView[], personaId: string) =>
  activities.flatMap((activity) => activity.tasks).filter((task) => task.personaIds.includes(personaId)).length;

/** With one persona picked, a new task is theirs, so it doesn't fade the moment it's added. */
export const personaForNewTask = (picked: PickedPersonas): string | null =>
  picked.size === 1 ? ([...picked][0] ?? null) : null;

const NAMES = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

/** Follows the team chip: "only" for one, where it's the point, and "All personas" for every one. */
export const personaChipLabel = (names: string[], personaCount: number) => {
  if (names.length > 1 && names.length === personaCount) return 'All personas';
  if (names.length === 1) return `${NAMES.format(names)} only`;
  if (names.length === 2) return NAMES.format(names);
  return `${String(names.length)} personas`;
};

/** The status line while personas are picked, with any picked teams. */
export const personaSummary = (
  teams: { phrase: string; onlyNoTeam: boolean },
  personaNames: string[],
  anyMatch: boolean,
) => {
  const personas = NAMES.format(personaNames);
  if (teams.phrase === '') {
    return anyMatch ? `Chapters without ${personas}’s tasks are folded away.` : `No tasks for ${personas} yet.`;
  }
  if (!anyMatch) return `No tasks for ${teams.phrase} and ${personas} yet.`;
  if (teams.onlyNoTeam) return `Chapters with no unowned tasks for ${personas} are folded away.`;
  return `Chapters without ${teams.phrase}’s tasks for ${personas} are folded away.`;
};
