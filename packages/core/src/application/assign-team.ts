import { notFound } from '../kernel/errors.ts';
import { assignTeam } from '../domain/map/team.ts';
import type { MapId, TaskId, TeamId } from '../domain/map/story-map.ts';
import type { MapRepository } from './ports.ts';

export const assignTeamInMap =
  (deps: { maps: MapRepository }) =>
  async ({ mapId, taskId, teamId }: { mapId: MapId; taskId: TaskId; teamId: TeamId | null }) => {
    const record = await deps.maps.find(mapId);
    if (record === null) throw notFound('MAP_NOT_FOUND', `No map with id ${mapId}.`);
    await deps.maps.save({ ...record, map: assignTeam(record.map, taskId, teamId) });
  };
