import { invariantViolation, notFound } from '../../kernel/errors.ts';
import type { StoryMap, Subtask, Task, TaskId } from './story-map.ts';

/** Where a task lands. `before` names the sibling it goes in front of, and null means the end. */
export type MoveDestination =
  { chapterId: string; before: TaskId | null } | { parentId: TaskId; before: TaskId | null };

function locate(map: StoryMap, id: TaskId) {
  for (const activity of map.activities) {
    for (const task of activity.tasks) {
      if (task.id === id) return { task, parentId: null };
      const sub = task.subtasks.find((other) => other.id === id);
      if (sub) return { task: { ...sub, subtasks: [] } as Task, parentId: task.id };
    }
  }
  return null;
}

function insert<T extends { id: TaskId }>(list: T[], item: T, before: TaskId | null): T[] {
  if (before === null) return [...list, item];
  const index = list.findIndex((other) => other.id === before);
  if (index === -1) throw notFound('DESTINATION_NOT_FOUND', `Nothing to place this before: ${before}.`);
  return [...list.slice(0, index), item, ...list.slice(index)];
}

const isTopLevel = (map: StoryMap, id: TaskId) =>
  map.activities.some((activity) => activity.tasks.some((task) => task.id === id));

/**
 * Moves a task, with any subtasks, keeping two levels at most.
 * `emptiedParent` is a task that has just lost its last child, because its old rating shouldn't come back.
 */
export function moveTaskInMap(
  map: StoryMap,
  id: TaskId,
  to: MoveDestination,
): { map: StoryMap; emptiedParent: TaskId | null } {
  const found = locate(map, id);
  if (found === null) throw notFound('TASK_NOT_FOUND', `No task with id ${id}.`);

  if ('parentId' in to) {
    if (to.parentId === id) throw invariantViolation('MOVE_INTO_ITSELF', 'A task can’t go inside itself.');
    if (found.task.subtasks.length > 0 || (locate(map, to.parentId) !== null && !isTopLevel(map, to.parentId))) {
      throw invariantViolation('WOULD_NEST_TOO_DEEP', 'Tasks nest two levels deep at most.');
    }
    if (!isTopLevel(map, to.parentId)) throw notFound('DESTINATION_NOT_FOUND', `No task with id ${to.parentId}.`);
  } else if (!map.activities.some((activity) => activity.id === to.chapterId)) {
    throw notFound('DESTINATION_NOT_FOUND', `No activity with id ${to.chapterId}.`);
  }

  const activities = map.activities.map((activity) => {
    const tasks = activity.tasks
      .filter((task) => task.id !== id)
      .map((task) => {
        const subtasks: Subtask[] = task.subtasks.filter((sub) => sub.id !== id);
        const landing = 'parentId' in to && to.parentId === task.id;
        return {
          ...task,
          subtasks: landing ? insert(subtasks, { id, name: found.task.name }, to.before) : subtasks,
        };
      });
    const landing = 'chapterId' in to && to.chapterId === activity.id;
    return { ...activity, tasks: landing ? insert(tasks, found.task, to.before) : tasks };
  });

  const moved = { ...map, activities };
  const emptied =
    found.parentId !== null &&
    activities.some((activity) =>
      activity.tasks.some((task) => task.id === found.parentId && task.subtasks.length === 0),
    );
  return { map: moved, emptiedParent: emptied ? found.parentId : null };
}
