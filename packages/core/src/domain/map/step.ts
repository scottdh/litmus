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
