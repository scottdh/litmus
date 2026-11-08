import type { ActivityView, PersonaView, TaskView } from '@litmus/core';
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

/** What removing a persona does, said before it's done. Counted like the Personas popover, so the numbers match. */
export const removePersonaWarning = (taskCount: number) => {
  if (taskCount === 0) return 'It isn’t on any tasks. You can undo this.';
  if (taskCount === 1) return 'It comes off 1 task, which stays on the map. You can undo this.';
  return `It comes off ${String(taskCount)} tasks, which stay on the map. You can undo this.`;
};

/** For each persona set on a subtask or step beneath, the names of those it comes from, in their order. */
export const personaSources = (children: { name: string; personaIds: string[] }[]) => {
  const sources = new Map<string, string[]>();
  for (const child of children) {
    for (const id of child.personaIds) sources.set(id, [...(sources.get(id) ?? []), child.name]);
  }
  return sources;
};

/** Under a persona that's locked on in the drawer's checklist, because it's set further down. */
export const personaSourceLine = (names: string[], noun: 'subtasks' | 'steps') =>
  names.length === 1 ? `From ${names[0] ?? ''}` : `From ${String(names.length)} ${noun}`;

/**
 * The drawer's byline, in the map's persona order. One set here and further down counts as further down, because
 * it can't be cleared here.
 */
export const personaByline = (
  personas: PersonaView[],
  own: string[],
  below: ReadonlyMap<string, string[]>,
): { own: PersonaView[]; below: PersonaView[] } => ({
  own: personas.filter((persona) => own.includes(persona.id) && !below.has(persona.id)),
  below: personas.filter((persona) => below.has(persona.id)),
});
