import { notFound } from '../kernel/errors.ts';
import { LIGHTS, type Light } from '../domain/map/light.ts';
import { deriveParentLight } from '../domain/map/parent-light.ts';
import type { MapId, TaskId } from '../domain/map/story-map.ts';
import type { MapRepository } from './ports.ts';

export interface LightCount {
  light: Light;
  count: number;
}

export interface SubtaskView {
  id: string;
  name: string;
  light: Light;
}

export interface TaskView {
  id: string;
  name: string;
  light: Light;
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

    const lights = new Map<TaskId, Light>(record.ratings.map((rating) => [rating.subjectId, rating.light]));
    const lightOf = (taskId: TaskId): Light => lights.get(taskId) ?? 'grey';

    return {
      id: record.map.id,
      name: record.map.name,
      productName: record.product.name,
      activities: record.map.activities.map((activity) => {
        const tasks = activity.tasks.map((task) => {
          const subtasks = task.subtasks.map((sub) => ({ id: sub.id, name: sub.name, light: lightOf(sub.id) }));
          const subLights = subtasks.map((sub) => sub.light);
          return {
            id: task.id,
            name: task.name,
            light: subtasks.length > 0 ? deriveParentLight(subLights) : lightOf(task.id),
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
