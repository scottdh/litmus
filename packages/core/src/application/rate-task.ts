import type { Clock } from '../kernel/clock.ts';
import { invariantViolation, notFound } from '../kernel/errors.ts';
import type { Evidence } from '../domain/map/evidence.ts';
import type { Light } from '../domain/map/light.ts';
import { createRating } from '../domain/map/rating.ts';
import type { MapId, StoryMap, TaskId } from '../domain/map/story-map.ts';
import type { MapRecord, MapRepository } from './ports.ts';

function assertRateable(map: StoryMap, id: TaskId) {
  for (const activity of map.activities) {
    for (const task of activity.tasks) {
      if (task.id === id) {
        if (task.subtasks.length > 0) {
          throw invariantViolation('PARENT_LIGHT_IS_DERIVED', 'A task with subtasks takes its light from them.');
        }
        return;
      }
      if (task.subtasks.some((sub) => sub.id === id)) return;
    }
  }
  throw notFound('TASK_NOT_FOUND', `No task with id ${id}.`);
}

/**
 * Sets a task's light with a review, adding it to the log. Earlier ratings stay, so the task keeps its history.
 * Hands back the before and after, so the rating can be undone.
 */
export const rateTask =
  (deps: { maps: MapRepository; clock: Clock }) =>
  async ({
    mapId,
    taskId,
    light,
    note,
  }: {
    mapId: MapId;
    taskId: TaskId;
    light: Light;
    note: string;
  }): Promise<{ before: MapRecord; after: MapRecord }> => {
    const before = await deps.maps.find(mapId);
    if (before === null) throw notFound('MAP_NOT_FOUND', `No map with id ${mapId}.`);
    assertRateable(before.map, taskId);

    const text = note.trim();
    const evidence: Evidence[] = text === '' ? [] : [{ kind: 'note', text }];
    const rating = createRating({
      subjectId: taskId,
      productId: before.product.id,
      light,
      evidence,
      ratedAt: deps.clock.now(),
    });
    const after: MapRecord = { ...before, ratings: [...before.ratings, rating] };
    await deps.maps.save(after);
    return { before, after };
  };
