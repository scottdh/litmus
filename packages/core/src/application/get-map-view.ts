import { notFound } from '../kernel/errors.ts';
import { LIGHTS, type Light } from '../domain/map/light.ts';
import { deriveParentLight } from '../domain/map/parent-light.ts';
import type { MapId, TaskId } from '../domain/map/story-map.ts';
import type { MapRepository } from './ports.ts';

export interface LightCount {
  light: Light;
  count: number;
}

export interface StepView {
  id: string;
  name: string;
  note: string;
}

export interface SubtaskView {
  id: string;
  name: string;
  light: Light;
  review: string | null;
  steps: StepView[];
}

export interface TeamView {
  id: string;
  name: string;
}

export interface TaskView {
  id: string;
  name: string;
  /** Null when no team has it yet. */
  teamId: string | null;
  light: Light;
  /** Why it has this light. Always null for a task with subtasks, whose light follows from them. */
  review: string | null;
  /** A review from before this task had subtasks. It no longer sets the colour. */
  earlierReview: string | null;
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

    const ratings = new Map(record.ratings.map((rating) => [rating.subjectId, rating]));
    const lightOf = (taskId: TaskId): Light => ratings.get(taskId)?.light ?? 'grey';
    const reviewOf = (taskId: TaskId): string | null => {
      const note = ratings.get(taskId)?.evidence.find((item) => item.kind === 'note');
      return note?.text ?? null;
    };

    return {
      id: record.map.id,
      name: record.map.name,
      productName: record.product.name,
      teams: record.map.teams.map((team) => ({ id: team.id, name: team.name })),
      activities: record.map.activities.map((activity) => {
        const tasks = activity.tasks.map((task) => {
          const subtasks = task.subtasks.map((sub) => ({
            id: sub.id,
            name: sub.name,
            light: lightOf(sub.id),
            review: reviewOf(sub.id),
            steps: sub.steps,
          }));
          const subLights = subtasks.map((sub) => sub.light);
          return {
            id: task.id,
            name: task.name,
            teamId: task.teamId ?? null,
            light: subtasks.length > 0 ? deriveParentLight(subLights) : lightOf(task.id),
            review: subtasks.length > 0 ? null : reviewOf(task.id),
            earlierReview: subtasks.length > 0 ? reviewOf(task.id) : null,
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
