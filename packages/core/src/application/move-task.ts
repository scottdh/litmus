import { notFound } from '../kernel/errors.ts';
import { moveTaskInMap, type MoveDestination } from '../domain/map/move.ts';
import type { MapId, TaskId } from '../domain/map/story-map.ts';
import type { MapRecord, MapRepository } from './ports.ts';

/** Moves a task, and hands back the before and after, so the move can be undone. */
export const moveTask =
  (deps: { maps: MapRepository }) =>
  async ({
    mapId,
    taskId,
    to,
  }: {
    mapId: MapId;
    taskId: TaskId;
    to: MoveDestination;
  }): Promise<{ before: MapRecord; after: MapRecord }> => {
    const before = await deps.maps.find(mapId);
    if (before === null) throw notFound('MAP_NOT_FOUND', `No map with id ${mapId}.`);

    const { map, emptiedParent } = moveTaskInMap(before.map, taskId, to);
    const after: MapRecord = {
      ...before,
      map,
      ratings: before.ratings.filter((rating) => rating.subjectId !== emptiedParent),
    };
    await deps.maps.save(after);
    return { before, after };
  };
