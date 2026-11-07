import { notFound } from '../../kernel/errors.ts';
import { tidyName } from './rename.ts';
import { PERSONA_ICONS, type PersonaIcon, type PersonaId, type StoryMap } from './story-map.ts';

const ensurePersona = (map: StoryMap, id: PersonaId) => {
  if (!map.personas.some((persona) => persona.id === id))
    throw notFound('PERSONA_NOT_FOUND', `No persona with id ${id}.`);
};

/** New personas go at the end, wearing the first icon nobody has. Once every icon is worn, the set starts again. */
export function addPersona(map: StoryMap, input: { id: PersonaId; name: string }): StoryMap {
  const worn = new Set(map.personas.map((persona) => persona.icon));
  const icon =
    PERSONA_ICONS.find((candidate) => !worn.has(candidate)) ??
    PERSONA_ICONS[map.personas.length % PERSONA_ICONS.length] ??
    'person';
  return { ...map, personas: [...map.personas, { id: input.id, name: tidyName(input.name), icon }] };
}

export function renamePersona(map: StoryMap, id: PersonaId, name: string): StoryMap {
  const tidied = tidyName(name);
  ensurePersona(map, id);
  return {
    ...map,
    personas: map.personas.map((persona) => (persona.id === id ? { ...persona, name: tidied } : persona)),
  };
}

export function setPersonaIcon(map: StoryMap, id: PersonaId, icon: PersonaIcon): StoryMap {
  if (!PERSONA_ICONS.includes(icon)) throw notFound('ICON_NOT_FOUND', `No persona icon called ${icon}.`);
  ensurePersona(map, id);
  return { ...map, personas: map.personas.map((persona) => (persona.id === id ? { ...persona, icon } : persona)) };
}

interface Carried {
  id: string;
  personaIds?: PersonaId[];
}

/** Sets whether a persona carries out a task, subtask or step. Personas on subtasks and steps roll up in the view. */
export function setPersona(map: StoryMap, itemId: string, personaId: PersonaId, on: boolean): StoryMap {
  ensurePersona(map, personaId);
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
