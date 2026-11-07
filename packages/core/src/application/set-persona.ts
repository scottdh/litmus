import { notFound } from '../kernel/errors.ts';
import { setPersona } from '../domain/map/persona.ts';
import type { MapId, PersonaId } from '../domain/map/story-map.ts';
import type { MapRepository } from './ports.ts';

export const setPersonaInMap =
  (deps: { maps: MapRepository }) =>
  async ({ mapId, itemId, personaId, on }: { mapId: MapId; itemId: string; personaId: PersonaId; on: boolean }) => {
    const record = await deps.maps.find(mapId);
    if (record === null) throw notFound('MAP_NOT_FOUND', `No map with id ${mapId}.`);
    await deps.maps.save({ ...record, map: setPersona(record.map, itemId, personaId, on) });
  };
