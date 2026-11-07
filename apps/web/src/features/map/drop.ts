import type { MapView, TaskView } from '@litmus/core';

export type Destination =
  | { chapterId: string; before: string | null }
  | { parentId: string; before: string | null }
  | { subtaskId: string; before: string | null };

export type Zone = 'before' | 'after' | 'inside' | 'end';

export interface Hover {
  /** A task, subtask or step, or a chapter when the zone is `end`. */
  overId: string;
  zone: Zone;
}

interface Siblings {
  list: { id: string }[];
  place: (before: string | null) => Destination;
}

type Found =
  { kind: 'task'; task: TaskView; siblings: Siblings } | { kind: 'subtask' | 'step'; task: null; siblings: Siblings };

/** Finds a task, subtask or step's row of siblings, and how to name a place among them. */
function locate(map: MapView, id: string): Found | null {
  for (const chapter of map.activities) {
    const inChapter: Siblings = {
      list: chapter.tasks,
      place: (before) => ({ chapterId: chapter.id, before }),
    };
    for (const task of chapter.tasks) {
      if (task.id === id) return { kind: 'task', task, siblings: inChapter };
      for (const sub of task.subtasks) {
        if (sub.id === id) {
          return {
            kind: 'subtask',
            task: null,
            siblings: { list: task.subtasks, place: (before) => ({ parentId: task.id, before }) },
          };
        }
        if (sub.steps.some((step) => step.id === id)) {
          return {
            kind: 'step',
            task: null,
            siblings: { list: sub.steps, place: (before) => ({ subtaskId: sub.id, before }) },
          };
        }
      }
    }
  }
  return null;
}

export const isStep = (map: MapView, id: string) => locate(map, id)?.kind === 'step';

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

/** Where on a row the pointer is, given what's being dragged. A step can only drop into a subtask, never beside it. */
export function hoverZone(map: MapView, draggedId: string, overId: string, fraction: number): Zone {
  if (isStep(map, draggedId) && locate(map, overId)?.kind === 'subtask') return 'inside';
  const canNest = overId !== draggedId && canHoldSubtasks(map, overId) && !hasSubtasks(map, draggedId);
  return zoneFor(fraction, canNest);
}

/** A step stays among steps: beside another step, or at the end of a subtask's. */
function stepDestinationFor(map: MapView, draggedId: string, { overId, zone }: Hover): Destination | null {
  const over = locate(map, overId);
  if (over?.kind === 'subtask') return zone === 'inside' ? { subtaskId: overId, before: null } : null;
  if (over?.kind !== 'step' || zone === 'inside' || zone === 'end') return null;
  return beside(over.siblings, draggedId, overId, zone);
}

function beside(siblings: Siblings, draggedId: string, overId: string, zone: 'before' | 'after'): Destination {
  if (zone === 'before') return siblings.place(overId);
  const others = siblings.list.filter((other) => other.id !== draggedId);
  const next = others[others.findIndex((other) => other.id === overId) + 1];
  return siblings.place(next?.id ?? null);
}

export function destinationFor(map: MapView, draggedId: string, hover: Hover): Destination | null {
  const { overId, zone } = hover;
  if (overId === draggedId) return null;
  if (isStep(map, draggedId)) return stepDestinationFor(map, draggedId, hover);
  const mustStaySubtask = hasSteps(map, draggedId);
  if (zone === 'end') return mustStaySubtask ? null : { chapterId: overId, before: null };

  const over = locate(map, overId);
  if (over === null || over.kind === 'step') return null;
  const draggedHasChildren = hasSubtasks(map, draggedId);

  if (zone === 'inside') {
    if (over.task === null || draggedHasChildren) return null;
    return { parentId: overId, before: null };
  }
  if (over.task === null && draggedHasChildren) return null;
  if (over.task !== null && mustStaySubtask) return null;

  return beside(over.siblings, draggedId, overId, zone);
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
  if (isStep(map, id)) {
    return map.activities
      .map((chapter) => ({
        chapter: chapter.name,
        choices: chapter.tasks.flatMap((task) =>
          task.subtasks.map((sub) => ({ label: `Inside ${sub.name}`, to: { subtaskId: sub.id, before: null } })),
        ),
      }))
      .filter((group) => group.choices.length > 0);
  }
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
  if ('subtaskId' in to) {
    const subtasks = map.activities.flatMap((chapter) => chapter.tasks.flatMap((task) => task.subtasks));
    return subtasks.find((sub) => sub.id === to.subtaskId)?.name ?? '';
  }
  if ('chapterId' in to) return map.activities.find((chapter) => chapter.id === to.chapterId)?.name ?? '';
  const parent = map.activities.flatMap((chapter) => chapter.tasks).find((task) => task.id === to.parentId);
  return parent?.name ?? '';
}
