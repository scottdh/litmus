import type { MapView, TaskView } from '@litmus/core';

export type Destination = { chapterId: string; before: string | null } | { parentId: string; before: string | null };

export type Zone = 'before' | 'after' | 'inside' | 'end';

export interface Hover {
  /** A task or subtask, or a chapter when the zone is `end`. */
  overId: string;
  zone: Zone;
}

interface Siblings {
  list: { id: string }[];
  place: (before: string | null) => Destination;
}

/** Finds a task's row of siblings, and how to name a place among them. */
function locate(map: MapView, id: string): { task: TaskView | null; siblings: Siblings } | null {
  for (const chapter of map.activities) {
    const inChapter: Siblings = {
      list: chapter.tasks,
      place: (before) => ({ chapterId: chapter.id, before }),
    };
    for (const task of chapter.tasks) {
      if (task.id === id) return { task, siblings: inChapter };
      if (task.subtasks.some((sub) => sub.id === id)) {
        return {
          task: null,
          siblings: { list: task.subtasks, place: (before) => ({ parentId: task.id, before }) },
        };
      }
    }
  }
  return null;
}

/** Where on a row the pointer is. The middle means "inside", if that's allowed. */
export function zoneFor(fraction: number, canNest: boolean): Zone {
  if (!canNest) return fraction < 0.5 ? 'before' : 'after';
  if (fraction < 0.3) return 'before';
  return fraction > 0.7 ? 'after' : 'inside';
}

/** A subtask with steps has to stay a subtask, because only subtasks hold steps. */
const hasSteps = (map: MapView, id: string) =>
  map.activities.some((chapter) =>
    chapter.tasks.some((task) => task.subtasks.some((sub) => sub.id === id && sub.steps.length > 0)),
  );

export const hasSubtasks = (map: MapView, id: string) => (locate(map, id)?.task?.subtasks.length ?? 0) > 0;

/** True for a top-level task, which is the only thing that can have children. */
export const canHoldSubtasks = (map: MapView, id: string) => locate(map, id)?.task != null;

export function destinationFor(map: MapView, draggedId: string, { overId, zone }: Hover): Destination | null {
  if (overId === draggedId) return null;
  const mustStaySubtask = hasSteps(map, draggedId);
  if (zone === 'end') return mustStaySubtask ? null : { chapterId: overId, before: null };

  const over = locate(map, overId);
  if (over === null) return null;
  const draggedHasChildren = hasSubtasks(map, draggedId);

  if (zone === 'inside') {
    if (over.task === null || draggedHasChildren) return null;
    return { parentId: overId, before: null };
  }
  if (over.task === null && draggedHasChildren) return null;
  if (over.task !== null && mustStaySubtask) return null;

  if (zone === 'before') return over.siblings.place(overId);
  const others = over.siblings.list.filter((other) => other.id !== draggedId);
  const next = others[others.findIndex((other) => other.id === overId) + 1];
  return over.siblings.place(next?.id ?? null);
}

/** One place up or down among siblings, or null at either end. */
export function stepDestination(map: MapView, id: string, step: -1 | 1): Destination | null {
  const found = locate(map, id);
  if (found === null) return null;
  const { list, place } = found.siblings;
  const index = list.findIndex((other) => other.id === id);
  if (step === -1) {
    const previous = list[index - 1];
    return previous ? place(previous.id) : null;
  }
  if (list[index + 1] === undefined) return null;
  return place(list[index + 2]?.id ?? null);
}

export interface MoveChoiceGroup {
  chapter: string;
  choices: { label: string; to: Destination }[];
}

/** For the Move to control, which is how keyboard and touch reach everything dragging can. */
export function moveChoices(map: MapView, id: string): MoveChoiceGroup[] {
  const canNest = !hasSubtasks(map, id);
  const canBeTask = !hasSteps(map, id);
  return map.activities
    .map((chapter) => ({
      chapter: chapter.name,
      choices: [
        ...(canBeTask ? [{ label: `End of ${chapter.name}`, to: { chapterId: chapter.id, before: null } }] : []),
        ...(canNest ? chapter.tasks : [])
          .filter((task) => task.id !== id)
          .map((task) => ({ label: `Inside ${task.name}`, to: { parentId: task.id, before: null } })),
      ],
    }))
    .filter((group) => group.choices.length > 0);
}

/** Says where something went, for the line beside Undo. */
export function describeDestination(map: MapView, to: Destination): string {
  if ('chapterId' in to) return map.activities.find((chapter) => chapter.id === to.chapterId)?.name ?? '';
  const parent = map.activities.flatMap((chapter) => chapter.tasks).find((task) => task.id === to.parentId);
  return parent?.name ?? '';
}
