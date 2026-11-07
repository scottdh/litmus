import { notFound } from '../kernel/errors.ts';
import { removeTeam } from '../domain/map/team.ts';
import type { MapId, TeamId } from '../domain/map/story-map.ts';
import type { MapRecord, MapRepository } from './ports.ts';

/** Hands back the before and after as well, so the removal can be undone. */
export const removeTeamFromMap =
  (deps: { maps: MapRepository }) =>
  async ({ mapId, teamId }: { mapId: MapId; teamId: TeamId }) => {
    const before = await deps.maps.find(mapId);
    if (before === null) throw notFound('MAP_NOT_FOUND', `No map with id ${mapId}.`);
    const after: MapRecord = { ...before, map: removeTeam(before.map, teamId) };
    await deps.maps.save(after);
    return { before, after };
  };
