import { notFound } from '../kernel/errors.ts';
import { renamePersona, setPersona, setPersonaIcon } from '../domain/map/persona.ts';
import type { MapId, PersonaIcon, PersonaId, StoryMap } from '../domain/map/story-map.ts';
import type { MapRepository } from './ports.ts';

const change = async (maps: MapRepository, mapId: MapId, apply: (map: StoryMap) => StoryMap) => {
  const record = await maps.find(mapId);
  if (record === null) throw notFound('MAP_NOT_FOUND', `No map with id ${mapId}.`);
  await maps.save({ ...record, map: apply(record.map) });
};

export const setPersonaInMap =
  (deps: { maps: MapRepository }) =>
  ({ mapId, itemId, personaId, on }: { mapId: MapId; itemId: string; personaId: PersonaId; on: boolean }) =>
    change(deps.maps, mapId, (map) => setPersona(map, itemId, personaId, on));

export const renamePersonaInMap =
  (deps: { maps: MapRepository }) =>
  ({ mapId, personaId, name }: { mapId: MapId; personaId: PersonaId; name: string }) =>
    change(deps.maps, mapId, (map) => renamePersona(map, personaId, name));

export const setPersonaIconInMap =
  (deps: { maps: MapRepository }) =>
  ({ mapId, personaId, icon }: { mapId: MapId; personaId: PersonaId; icon: PersonaIcon }) =>
    change(deps.maps, mapId, (map) => setPersonaIcon(map, personaId, icon));
