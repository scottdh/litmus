import { notFound } from '../kernel/errors.ts';
import { addStep, moveStep, renameStep, setStepNote, type StepDestination } from '../domain/map/step.ts';
import type { MapId, StepId, StoryMap, TaskId } from '../domain/map/story-map.ts';
import type { MapRecord, MapRepository } from './ports.ts';

const change = async (maps: MapRepository, mapId: MapId, apply: (map: StoryMap) => StoryMap) => {
  const before = await maps.find(mapId);
  if (before === null) throw notFound('MAP_NOT_FOUND', `No map with id ${mapId}.`);
  const after: MapRecord = { ...before, map: apply(before.map) };
  await maps.save(after);
  return { before, after };
};

/** Hands back the before and after as well, so the add can be undone. */
export const addStepToMap =
  ({ maps, newId }: { maps: MapRepository; newId: () => string }) =>
  async ({ mapId, name, subtaskId }: { mapId: MapId; name: string; subtaskId: TaskId }) => {
    const id = `stp_${newId()}` as StepId;
    const changed = await change(maps, mapId, (map) => addStep(map, { id, name, subtaskId }));
    return { id, ...changed };
  };

export const renameStepInMap =
  (deps: { maps: MapRepository }) =>
  async ({ mapId, stepId, name }: { mapId: MapId; stepId: StepId; name: string }) => {
    await change(deps.maps, mapId, (map) => renameStep(map, stepId, name));
  };

export const setStepNoteInMap =
  (deps: { maps: MapRepository }) =>
  async ({ mapId, stepId, note }: { mapId: MapId; stepId: StepId; note: string }) => {
    await change(deps.maps, mapId, (map) => setStepNote(map, stepId, note));
  };

/** Steps take no light, so ratings are untouched. Hands back the before and after, so the move can be undone. */
export const moveStepInMap =
  (deps: { maps: MapRepository }) =>
  async ({ mapId, stepId, to }: { mapId: MapId; stepId: StepId; to: StepDestination }) =>
    change(deps.maps, mapId, (map) => moveStep(map, stepId, to));
