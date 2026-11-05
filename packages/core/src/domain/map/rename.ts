import { notFound, validationError } from '../../kernel/errors.ts';
import type { StoryMap, TaskId } from './story-map.ts';

/** Names are one line, so pasted line breaks and stray spaces are tidied rather than refused. */
function tidyName(name: string): string {
  const tidied = name.replace(/\s+/g, ' ').trim();
  if (tidied === '') throw validationError('NAME_EMPTY', 'A name can’t be empty.');
  return tidied;
}

/** Renames a task or a subtask. */
export function renameTask(map: StoryMap, id: TaskId, name: string): StoryMap {
  const tidied = tidyName(name);
  const exists = map.activities.some((activity) =>
    activity.tasks.some((task) => task.id === id || task.subtasks.some((sub) => sub.id === id)),
  );
  if (!exists) throw notFound('TASK_NOT_FOUND', `No task with id ${id}.`);
  const named = <T extends { id: TaskId }>(item: T): T => (item.id === id ? { ...item, name: tidied } : item);
  return {
    ...map,
    activities: map.activities.map((activity) => ({
      ...activity,
      tasks: activity.tasks.map((task) => ({ ...named(task), subtasks: task.subtasks.map(named) })),
    })),
  };
}

export function renameActivity(map: StoryMap, id: string, name: string): StoryMap {
  const tidied = tidyName(name);
  if (!map.activities.some((activity) => activity.id === id)) {
    throw notFound('ACTIVITY_NOT_FOUND', `No activity with id ${id}.`);
  }
  return {
    ...map,
    activities: map.activities.map((activity) => (activity.id === id ? { ...activity, name: tidied } : activity)),
  };
}
