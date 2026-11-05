import { invariantViolation, notFound } from '../kernel/errors.ts';
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

/** Puts the map back, unless it has changed since, in which case that change would be lost. */
export const undoMove =
  (deps: { maps: MapRepository }) =>
  async ({ mapId, before, after }: { mapId: MapId; before: MapRecord; after: MapRecord }) => {
    const current = await deps.maps.find(mapId);
    if (current === null) throw notFound('MAP_NOT_FOUND', `No map with id ${mapId}.`);
    if (JSON.stringify(current) !== JSON.stringify(after)) {
      throw invariantViolation('UNDO_OUT_OF_DATE', 'The map has changed since this move.');
    }
    await deps.maps.save(before);
  };
