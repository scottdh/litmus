import { notFound } from '../kernel/errors.ts';
import { removePersona } from '../domain/map/persona.ts';
import type { MapId, PersonaId } from '../domain/map/story-map.ts';
import type { MapRecord, MapRepository } from './ports.ts';

/** Hands back the before and after as well, so the removal can be undone. */
export const removePersonaFromMap =
  (deps: { maps: MapRepository }) =>
  async ({ mapId, personaId }: { mapId: MapId; personaId: PersonaId }) => {
    const before = await deps.maps.find(mapId);
    if (before === null) throw notFound('MAP_NOT_FOUND', `No map with id ${mapId}.`);
    const after: MapRecord = { ...before, map: removePersona(before.map, personaId) };
    await deps.maps.save(after);
    return { before, after };
  };
