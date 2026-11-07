import { notFound } from '../kernel/errors.ts';
import { addActivity, addTask, type AddDestination } from '../domain/map/add.ts';
import { addTeam } from '../domain/map/team.ts';
import type { MapId, PersonaId, StoryMap, TaskId, TeamId } from '../domain/map/story-map.ts';
import type { MapRecord, MapRepository } from './ports.ts';

interface Deps {
  maps: MapRepository;
  newId: () => string;
}

/** Hands back the before and after as well, so the add can be undone. */
const change = async (maps: MapRepository, mapId: MapId, id: string, apply: (map: StoryMap) => StoryMap) => {
  const before = await maps.find(mapId);
  if (before === null) throw notFound('MAP_NOT_FOUND', `No map with id ${mapId}.`);
  const after: MapRecord = { ...before, map: apply(before.map) };
  await maps.save(after);
  return { id, before, after };
};

export const addTaskToMap =
  ({ maps, newId }: Deps) =>
  ({
    mapId,
    name,
    to,
    teamId = null,
    personaIds = [],
  }: {
    mapId: MapId;
    name: string;
    to: AddDestination;
    teamId?: TeamId | null;
    personaIds?: PersonaId[];
  }) => {
    const id = `tsk_${newId()}` as TaskId;
    return change(maps, mapId, id, (map) => addTask(map, { id, name, to, teamId, personaIds }));
  };

export const addChapter =
  ({ maps, newId }: Deps) =>
  ({ mapId, name, before }: { mapId: MapId; name: string; before: string | null }) => {
    const id = `act_${newId()}`;
    return change(maps, mapId, id, (map) => addActivity(map, { id, name, before }));
  };

export const addTeamToMap =
  ({ maps, newId }: Deps) =>
  ({ mapId, name }: { mapId: MapId; name: string }) => {
    const id = `tm_${newId()}` as TeamId;
    return change(maps, mapId, id, (map) => addTeam(map, { id, name }));
  };
