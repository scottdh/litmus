import { notFound, validationError } from '../../kernel/errors.ts';
import type { IdeaId, PainPointId, PersonaId, Quote, QuoteId, Research, StoryMap } from './story-map.ts';

export interface QuoteInput {
  text: string;
  participant: string;
  personaId?: PersonaId;
}

/** One change to one item's research. Quotes, which run long, keep their line breaks, as does the summary. */
export type ResearchEdit =
  | { action: 'set-summary'; text: string }
  | { action: 'add'; list: 'pains' | 'ideas'; text: string }
  | { action: 'add'; list: 'hearing'; quote: QuoteInput }
  | { action: 'edit'; list: 'pains' | 'ideas'; id: string; text: string }
  | { action: 'edit'; list: 'hearing'; id: string; quote: QuoteInput }
  | { action: 'remove'; list: 'pains' | 'hearing' | 'ideas'; id: string };

export type ResearchList = 'pains' | 'hearing' | 'ideas';

const EMPTY: Research = { summary: '', pains: [], hearing: [], ideas: [] };

const words = (text: string) => {
  const trimmed = text.trim();
  if (trimmed === '') throw validationError('TEXT_EMPTY', 'Research can’t be empty.');
  return trimmed;
};

const quoteOf = (map: StoryMap, id: string, input: QuoteInput): Quote => {
  const text = words(input.text);
  const participant = input.participant.trim();
  if (participant === '') throw validationError('PARTICIPANT_EMPTY', 'A quote needs a participant.');
  if (input.personaId !== undefined && !map.personas.some((persona) => persona.id === input.personaId)) {
    throw notFound('PERSONA_NOT_FOUND', `No persona with id ${input.personaId}.`);
  }
  return {
    id: id as QuoteId,
    text,
    participant,
    ...(input.personaId === undefined ? {} : { personaId: input.personaId }),
  };
};

const ensureListed = (research: Research, list: ResearchList, id: string) => {
  const items: { id: string }[] = research[list];
  if (!items.some((item) => item.id === id)) {
    throw notFound('RESEARCH_ITEM_NOT_FOUND', `No ${list} item with id ${id} here.`);
  }
};

const without = <T extends { id: string }>(items: T[], id: string) => items.filter((item) => item.id !== id);
const put = <T extends { id: string }>(items: T[], item: T, adding: boolean) =>
  adding ? [...items, item] : items.map((other) => (other.id === item.id ? item : other));

function apply(map: StoryMap, research: Research, edit: ResearchEdit, addedId: string): Research {
  if (edit.action === 'set-summary') return { ...research, summary: edit.text.trim() };
  if (edit.action !== 'add') ensureListed(research, edit.list, edit.id);
  if (edit.action === 'remove') {
    if (edit.list === 'pains') return { ...research, pains: without(research.pains, edit.id) };
    if (edit.list === 'hearing') return { ...research, hearing: without(research.hearing, edit.id) };
    return { ...research, ideas: without(research.ideas, edit.id) };
  }
  const adding = edit.action === 'add';
  const id = adding ? addedId : edit.id;
  if (edit.list === 'hearing')
    return { ...research, hearing: put(research.hearing, quoteOf(map, id, edit.quote), adding) };
  if (edit.list === 'pains') {
    return { ...research, pains: put(research.pains, { id: id as PainPointId, text: words(edit.text) }, adding) };
  }
  return { ...research, ideas: put(research.ideas, { id: id as IdeaId, text: words(edit.text) }, adding) };
}

const isEmpty = (research: Research) =>
  research.summary === '' && research.pains.length + research.hearing.length + research.ideas.length === 0;

/**
 * Changes one task's, subtask's or step's research. Nothing rolls up, and no light is touched.
 * Research left with nothing in it is dropped, so the item reads as having none.
 */
export function editResearch(map: StoryMap, itemId: string, edit: ResearchEdit, addedId: string): StoryMap {
  const items = map.activities.flatMap((activity) =>
    activity.tasks.flatMap((task) => [task, ...task.subtasks, ...task.subtasks.flatMap((sub) => sub.steps)]),
  );
  if (!items.some((item) => item.id === itemId)) {
    throw notFound('ITEM_NOT_FOUND', `No task, subtask or step with id ${itemId}.`);
  }
  const changed = <T extends { id: string; research?: Research }>(item: T): T => {
    if (item.id !== itemId) return item;
    const { research: current, ...rest } = item;
    const next = apply(map, current ?? EMPTY, edit, addedId);
    return (isEmpty(next) ? rest : { ...rest, research: next }) as T;
  };
  return {
    ...map,
    activities: map.activities.map((activity) => ({
      ...activity,
      tasks: activity.tasks.map((task) =>
        changed({
          ...task,
          subtasks: task.subtasks.map((sub) => changed({ ...sub, steps: sub.steps.map(changed) })),
        }),
      ),
    })),
  };
}
