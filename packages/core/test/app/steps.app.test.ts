import { describe, expect, it } from 'vitest';
import {
  addStepToMap,
  getMapView,
  renameStepInMap,
  setStepNoteInMap,
  type MapId,
  type MapRepository,
  type ProductId,
  type StepId,
  type TaskId,
} from '../../src/index.ts';
import { createInMemoryMapRepository } from '../../src/adapters/in-memory/index.ts';

const MAP_ID = 'map_1' as MapId;
const CHILD = 'tsk_child' as TaskId;
const newId = () => 'new';

function repository(): MapRepository {
  return createInMemoryMapRepository([
    {
      map: {
        id: MAP_ID,
        name: 'A small map',
        activities: [
          {
            id: 'act_1',
            name: 'First',
            tasks: [
              { id: 'tsk_parent' as TaskId, name: 'Parent', subtasks: [{ id: CHILD, name: 'Child', steps: [] }] },
            ],
          },
        ],
      },
      product: { id: 'prd_1' as ProductId, name: 'Thing' },
      ratings: [],
    },
  ]);
}

const stepsOf = async (maps: MapRepository) =>
  (await getMapView({ maps })(MAP_ID)).activities[0]?.tasks[0]?.subtasks[0]?.steps;

describe('steps', () => {
  it('saves a new step, and hands back what’s needed to undo it', async () => {
    const maps = repository();
    const { id, before, after } = await addStepToMap({ maps, newId })({
      mapId: MAP_ID,
      name: 'Fresh',
      subtaskId: CHILD,
    });
    expect(id).toBe('stp_new');
    expect(await stepsOf(maps)).toEqual([{ id: 'stp_new', name: 'Fresh', note: '' }]);
    expect(before).not.toEqual(after);
  });

  it('keeps a renamed step', async () => {
    const maps = repository();
    const { id } = await addStepToMap({ maps, newId })({ mapId: MAP_ID, name: 'Fresh', subtaskId: CHILD });
    await renameStepInMap({ maps })({ mapId: MAP_ID, stepId: id as StepId, name: 'Renamed' });
    expect((await stepsOf(maps))?.[0]?.name).toBe('Renamed');
  });

  it('keeps a step’s note', async () => {
    const maps = repository();
    const { id } = await addStepToMap({ maps, newId })({ mapId: MAP_ID, name: 'Fresh', subtaskId: CHILD });
    await setStepNoteInMap({ maps })({ mapId: MAP_ID, stepId: id as StepId, note: 'Invented research.' });
    expect((await stepsOf(maps))?.[0]?.note).toBe('Invented research.');
  });

  it('reports a map that does not exist', async () => {
    const error: unknown = await addStepToMap({ maps: repository(), newId })({
      mapId: 'nope' as MapId,
      name: 'Fresh',
      subtaskId: CHILD,
    }).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ code: 'MAP_NOT_FOUND' });
  });
});
