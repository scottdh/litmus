import { invariantViolation, notFound } from '../kernel/errors.ts';
import type { MapId } from '../domain/map/story-map.ts';
import type { MapRecord, MapRepository } from './ports.ts';

/** Puts the map back, unless it has changed since, in which case that change would be lost. */
export const undoChange =
  (deps: { maps: MapRepository }) =>
  async ({ mapId, before, after }: { mapId: MapId; before: MapRecord; after: MapRecord }) => {
    const current = await deps.maps.find(mapId);
    if (current === null) throw notFound('MAP_NOT_FOUND', `No map with id ${mapId}.`);
    if (JSON.stringify(current) !== JSON.stringify(after)) {
      throw invariantViolation('UNDO_OUT_OF_DATE', 'The map has changed since this change.');
    }
    await deps.maps.save(before);
  };
