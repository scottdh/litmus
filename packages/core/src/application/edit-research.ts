import { notFound } from '../kernel/errors.ts';
import { editResearch, type ResearchEdit } from '../domain/map/research.ts';
import type { MapId } from '../domain/map/story-map.ts';
import type { MapRecord, MapRepository } from './ports.ts';

const PREFIX = { pains: 'pain', hearing: 'qt', ideas: 'idea' } as const;

/**
 * Changes a task's, subtask's or step's research, one item at a time. Ratings are untouched: a quote isn't evidence.
 * Hands back the before and after, so the change can be undone, and an added item's id.
 */
export const editResearchInMap =
  ({ maps, newId }: { maps: MapRepository; newId: () => string }) =>
  async ({ mapId, itemId, edit }: { mapId: MapId; itemId: string; edit: ResearchEdit }) => {
    const before = await maps.find(mapId);
    if (before === null) throw notFound('MAP_NOT_FOUND', `No map with id ${mapId}.`);
    const id = edit.action === 'add' ? `${PREFIX[edit.list]}_${newId()}` : null;
    const after: MapRecord = { ...before, map: editResearch(before.map, itemId, edit, id ?? '') };
    await maps.save(after);
    return { id, before, after };
  };
