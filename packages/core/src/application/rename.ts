import { notFound } from '../kernel/errors.ts';
import { renameActivity, renameTask } from '../domain/map/rename.ts';
import { renameTeam } from '../domain/map/team.ts';
import type { MapId, StoryMap, TaskId, TeamId } from '../domain/map/story-map.ts';
import type { MapRepository } from './ports.ts';

const change = async (maps: MapRepository, mapId: MapId, apply: (map: StoryMap) => StoryMap) => {
  const record = await maps.find(mapId);
  if (record === null) throw notFound('MAP_NOT_FOUND', `No map with id ${mapId}.`);
  await maps.save({ ...record, map: apply(record.map) });
};

export const renameTaskInMap =
  (deps: { maps: MapRepository }) =>
  ({ mapId, taskId, name }: { mapId: MapId; taskId: TaskId; name: string }) =>
    change(deps.maps, mapId, (map) => renameTask(map, taskId, name));

export const renameChapter =
  (deps: { maps: MapRepository }) =>
  ({ mapId, activityId, name }: { mapId: MapId; activityId: string; name: string }) =>
    change(deps.maps, mapId, (map) => renameActivity(map, activityId, name));

export const renameTeamInMap =
  (deps: { maps: MapRepository }) =>
  ({ mapId, teamId, name }: { mapId: MapId; teamId: TeamId; name: string }) =>
    change(deps.maps, mapId, (map) => renameTeam(map, teamId, name));
