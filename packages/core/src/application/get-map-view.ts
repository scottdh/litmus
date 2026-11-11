import { notFound } from '../kernel/errors.ts';
import { LIGHTS, type Light } from '../domain/map/light.ts';
import { deriveParentLight } from '../domain/map/parent-light.ts';
import { latestRatings, noteOf } from '../domain/map/rating.ts';
import type { MapId, PersonaIcon, Quote, Research, TaskId } from '../domain/map/story-map.ts';
import type { MapRepository } from './ports.ts';

export interface LightCount {
  light: Light;
  count: number;
}

export interface QuoteView {
  id: string;
  text: string;
  /** Null when nobody on the map matches who said it. */
  personaId: string | null;
  participant: string;
}

/** A pain point or an idea. */
export interface ResearchItemView {
  id: string;
  text: string;
}

export interface ResearchView {
  summary: string;
  pains: ResearchItemView[];
  /** Every quote, in the order it was written. */
  hearing: QuoteView[];
  ideas: ResearchItemView[];
}

export interface StepView {
  id: string;
  name: string;
  note: string;
  personaIds: string[];
  research: ResearchView | null;
}

export interface SubtaskView {
  id: string;
  name: string;
  light: Light;
  review: string | null;
  /** Its own team, or its task's when it follows it. Null when neither has one. */
  teamId: string | null;
  /** Null when it follows its task. */
  ownTeamId: string | null;
  /** Set on this subtask. */
  ownPersonaIds: string[];
  /** Its own and its steps', in the map's persona order. */
  personaIds: string[];
  research: ResearchView | null;
  steps: StepView[];
}

export interface TeamView {
  id: string;
  name: string;
}

export interface PersonaView {
  id: string;
  name: string;
  icon: PersonaIcon;
}

export interface TaskView {
  id: string;
  name: string;
  /** Null when no team has it yet. */
  teamId: string | null;
  /** Set on this task. */
  ownPersonaIds: string[];
  /** Its own, its subtasks' and their steps', in the map's persona order. */
  personaIds: string[];
  light: Light;
  /** Why it has this light. Always null for a task with subtasks, whose light follows from them. */
  review: string | null;
  /** A review from before this task had subtasks. It no longer sets the colour. */
  earlierReview: string | null;
  /** Its own only. A parent never shows its subtasks' research. */
  research: ResearchView | null;
  subtasks: SubtaskView[];
  mix: LightCount[];
}

export interface ActivityView {
  id: string;
  name: string;
  tasks: TaskView[];
  mix: LightCount[];
}

export interface MapView {
  id: string;
  name: string;
  productName: string;
  teams: TeamView[];
  personas: PersonaView[];
  activities: ActivityView[];
}

const countLights = (lights: Light[]): LightCount[] =>
  LIGHTS.map((light) => ({ light, count: lights.filter((other) => other === light).length })).filter(
    (entry) => entry.count > 0,
  );

export const getMapView =
  (deps: { maps: MapRepository }) =>
  async (id: MapId): Promise<MapView> => {
    const record = await deps.maps.find(id);
    if (record === null) throw notFound('MAP_NOT_FOUND', `No map with id ${id}.`);

    const ratings = latestRatings(record.ratings);
    const lightOf = (taskId: TaskId): Light => ratings.get(taskId)?.light ?? 'grey';
    const reviewOf = (taskId: TaskId): string | null => noteOf(ratings.get(taskId));

    const personaOrder = record.map.personas.map((persona) => persona.id);
    const rollUp = (...lists: (readonly string[] | undefined)[]): string[] => {
      const all = new Set(lists.flatMap((list) => list ?? []));
      return personaOrder.filter((id) => all.has(id));
    };
    const quoteOf = (quote: Quote): QuoteView => ({
      id: quote.id,
      text: quote.text,
      personaId: quote.personaId !== undefined && personaOrder.includes(quote.personaId) ? quote.personaId : null,
      participant: quote.participant,
    });
    const researchOf = (research: Research | undefined): ResearchView | null =>
      research === undefined
        ? null
        : {
            summary: research.summary,
            pains: research.pains.map((pain) => ({ id: pain.id, text: pain.text })),
            hearing: research.hearing.map(quoteOf),
            ideas: research.ideas.map((idea) => ({ id: idea.id, text: idea.text })),
          };

    return {
      id: record.map.id,
      name: record.map.name,
      productName: record.product.name,
      teams: record.map.teams.map((team) => ({ id: team.id, name: team.name })),
      personas: record.map.personas.map((persona) => ({ id: persona.id, name: persona.name, icon: persona.icon })),
      activities: record.map.activities.map((activity) => {
        const tasks = activity.tasks.map((task) => {
          const subtasks = task.subtasks.map((sub) => ({
            id: sub.id,
            name: sub.name,
            light: lightOf(sub.id),
            review: reviewOf(sub.id),
            teamId: sub.teamId ?? task.teamId ?? null,
            ownTeamId: sub.teamId ?? null,
            ownPersonaIds: rollUp(sub.personaIds),
            personaIds: rollUp(sub.personaIds, ...sub.steps.map((step) => step.personaIds)),
            research: researchOf(sub.research),
            steps: sub.steps.map((step) => ({
              id: step.id,
              name: step.name,
              note: step.note,
              personaIds: rollUp(step.personaIds),
              research: researchOf(step.research),
            })),
          }));
          const subLights = subtasks.map((sub) => sub.light);
          return {
            id: task.id,
            name: task.name,
            teamId: task.teamId ?? null,
            ownPersonaIds: rollUp(task.personaIds),
            personaIds: rollUp(task.personaIds, ...subtasks.map((sub) => sub.personaIds)),
            light: subtasks.length > 0 ? deriveParentLight(subLights) : lightOf(task.id),
            review: subtasks.length > 0 ? null : reviewOf(task.id),
            earlierReview: subtasks.length > 0 ? reviewOf(task.id) : null,
            research: researchOf(task.research),
            subtasks,
            mix: countLights(subLights),
          };
        });
        return {
          id: activity.id,
          name: activity.name,
          tasks,
          mix: countLights(tasks.map((task) => task.light)),
        };
      }),
    };
  };
