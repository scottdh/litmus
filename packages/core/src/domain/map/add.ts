import { invariantViolation, notFound } from '../../kernel/errors.ts';
import { tidyName } from './rename.ts';
import type { PersonaId, StoryMap, Task, TaskId, TeamId } from './story-map.ts';

/** New tasks go at the end of their list. Dragging puts them anywhere else. */
export type AddDestination = { chapterId: string } | { parentId: TaskId };

/**
 * `teamId` only applies to a new top-level task, because a subtask shares its task's team.
 * `personaIds` go on with the add, so undoing it takes them away too.
 */
export function addTask(
  map: StoryMap,
  input: { id: TaskId; name: string; to: AddDestination; teamId?: TeamId | null; personaIds?: PersonaId[] },
): StoryMap {
  const name = tidyName(input.name);
  const { id, to } = input;
  const teamId = input.teamId ?? null;
  if (teamId !== null) {
    if (!('chapterId' in to)) throw invariantViolation('TEAM_IS_ON_THE_TASK', 'A subtask shares its task’s team.');
    if (!map.teams.some((team) => team.id === teamId)) throw notFound('TEAM_NOT_FOUND', `No team with id ${teamId}.`);
  }
  const personaIds = input.personaIds ?? [];
  const unknown = personaIds.find((personaId) => !map.personas.some((persona) => persona.id === personaId));
  if (unknown !== undefined) throw notFound('PERSONA_NOT_FOUND', `No persona with id ${unknown}.`);
  const carried = personaIds.length > 0 ? { personaIds } : {};
  const added: Task = { id, name, ...(teamId === null ? {} : { teamId }), ...carried, subtasks: [] };
  if ('chapterId' in to) {
    if (!map.activities.some((activity) => activity.id === to.chapterId)) {
      throw notFound('ACTIVITY_NOT_FOUND', `No activity with id ${to.chapterId}.`);
    }
  } else {
    const tasks = map.activities.flatMap((activity) => activity.tasks);
    if (tasks.some((task) => task.subtasks.some((sub) => sub.id === to.parentId))) {
      throw invariantViolation('WOULD_NEST_TOO_DEEP', 'Tasks nest two levels deep at most.');
    }
    if (!tasks.some((task) => task.id === to.parentId)) {
      throw notFound('TASK_NOT_FOUND', `No task with id ${to.parentId}.`);
    }
  }
  return {
    ...map,
    activities: map.activities.map((activity) => ({
      ...activity,
      tasks:
        'chapterId' in to
          ? activity.id === to.chapterId
            ? [...activity.tasks, added]
            : activity.tasks
          : activity.tasks.map((task) =>
              task.id === to.parentId
                ? { ...task, subtasks: [...task.subtasks, { id, name, ...carried, steps: [] }] }
                : task,
            ),
    })),
  };
}

/** `before` names the chapter it goes in front of, and null means the end of the story. */
export function addActivity(map: StoryMap, input: { id: string; name: string; before: string | null }): StoryMap {
  const added = { id: input.id, name: tidyName(input.name), tasks: [] };
  const index = input.before === null ? map.activities.length : map.activities.findIndex((a) => a.id === input.before);
  if (index === -1) throw notFound('DESTINATION_NOT_FOUND', `No activity with id ${String(input.before)}.`);
  return { ...map, activities: [...map.activities.slice(0, index), added, ...map.activities.slice(index)] };
}
