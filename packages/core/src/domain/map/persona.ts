import { notFound } from '../../kernel/errors.ts';
import type { PersonaId, StoryMap } from './story-map.ts';

interface Carried {
  id: string;
  personaIds?: PersonaId[];
}

/** Sets whether a persona carries out a task, subtask or step. Personas on subtasks and steps roll up in the view. */
export function setPersona(map: StoryMap, itemId: string, personaId: PersonaId, on: boolean): StoryMap {
  if (!map.personas.some((persona) => persona.id === personaId)) {
    throw notFound('PERSONA_NOT_FOUND', `No persona with id ${personaId}.`);
  }
  const items = map.activities.flatMap((activity) =>
    activity.tasks.flatMap((task) => [task, ...task.subtasks, ...task.subtasks.flatMap((sub) => sub.steps)]),
  );
  if (!items.some((item) => item.id === itemId)) {
    throw notFound('ITEM_NOT_FOUND', `No task, subtask or step with id ${itemId}.`);
  }
  const mark = <T extends Carried>(item: T): T => {
    if (item.id !== itemId) return item;
    const others = (item.personaIds ?? []).filter((other) => other !== personaId);
    return { ...item, personaIds: on ? [...others, personaId] : others };
  };
  return {
    ...map,
    activities: map.activities.map((activity) => ({
      ...activity,
      tasks: activity.tasks.map((task) =>
        mark({ ...task, subtasks: task.subtasks.map((sub) => mark({ ...sub, steps: sub.steps.map(mark) })) }),
      ),
    })),
  };
}
