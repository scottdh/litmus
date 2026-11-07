import { invariantViolation, notFound } from '../../kernel/errors.ts';
import { tidyName } from './rename.ts';
import type { Step, StepId, StoryMap, Subtask, TaskId } from './story-map.ts';

const mapSubtasks = (map: StoryMap, change: (subtask: Subtask) => Subtask): StoryMap => ({
  ...map,
  activities: map.activities.map((activity) => ({
    ...activity,
    tasks: activity.tasks.map((task) => ({ ...task, subtasks: task.subtasks.map(change) })),
  })),
});

/** Only subtasks hold steps. New ones go at the end of the list. */
export function addStep(map: StoryMap, input: { id: StepId; name: string; subtaskId: TaskId }): StoryMap {
  const name = tidyName(input.name);
  const tasks = map.activities.flatMap((activity) => activity.tasks);
  if (tasks.some((task) => task.id === input.subtaskId)) {
    throw invariantViolation('STEPS_NEED_A_SUBTASK', 'Only subtasks hold steps.');
  }
  if (!tasks.some((task) => task.subtasks.some((sub) => sub.id === input.subtaskId))) {
    throw notFound('TASK_NOT_FOUND', `No subtask with id ${input.subtaskId}.`);
  }
  const added: Step = { id: input.id, name, note: '' };
  return mapSubtasks(map, (sub) => (sub.id === input.subtaskId ? { ...sub, steps: [...sub.steps, added] } : sub));
}

/** Where a step lands. `before` names the step it goes in front of, and null means the end. */
export interface StepDestination {
  subtaskId: TaskId;
  before: StepId | null;
}

/** A step only ever moves among subtasks' steps, so it can't become a task or take a light. */
export function moveStep(map: StoryMap, id: StepId, to: StepDestination): StoryMap {
  const subtasks = map.activities.flatMap((activity) => activity.tasks.flatMap((task) => task.subtasks));
  const step = subtasks.flatMap((sub) => sub.steps).find((other) => other.id === id);
  if (step === undefined) throw notFound('STEP_NOT_FOUND', `No step with id ${id}.`);
  if (map.activities.some((activity) => activity.tasks.some((task) => task.id === to.subtaskId))) {
    throw invariantViolation('STEPS_NEED_A_SUBTASK', 'Only subtasks hold steps.');
  }
  if (!subtasks.some((sub) => sub.id === to.subtaskId))
    throw notFound('DESTINATION_NOT_FOUND', `No subtask with id ${to.subtaskId}.`);

  return mapSubtasks(map, (sub) => {
    const steps = sub.steps.filter((other) => other.id !== id);
    if (sub.id !== to.subtaskId) return steps.length === sub.steps.length ? sub : { ...sub, steps };
    if (to.before === null) return { ...sub, steps: [...steps, step] };
    const index = steps.findIndex((other) => other.id === to.before);
    if (index === -1) throw notFound('DESTINATION_NOT_FOUND', `Nothing to place this before: ${to.before}.`);
    return { ...sub, steps: [...steps.slice(0, index), step, ...steps.slice(index)] };
  });
}

function changeStep(map: StoryMap, id: StepId, change: (step: Step) => Step): StoryMap {
  const exists = map.activities.some((activity) =>
    activity.tasks.some((task) => task.subtasks.some((sub) => sub.steps.some((step) => step.id === id))),
  );
  if (!exists) throw notFound('STEP_NOT_FOUND', `No step with id ${id}.`);
  return mapSubtasks(map, (sub) => ({
    ...sub,
    steps: sub.steps.map((step) => (step.id === id ? change(step) : step)),
  }));
}

export function renameStep(map: StoryMap, id: StepId, name: string): StoryMap {
  const tidied = tidyName(name);
  return changeStep(map, id, (step) => ({ ...step, name: tidied }));
}

/** Notes can run to several paragraphs, so only the ends are tidied. An empty note is fine. */
export function setStepNote(map: StoryMap, id: StepId, note: string): StoryMap {
  const tidied = note.trim();
  return changeStep(map, id, (step) => ({ ...step, note: tidied }));
}
