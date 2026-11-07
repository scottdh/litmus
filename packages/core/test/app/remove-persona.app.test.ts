import { describe, expect, it } from 'vitest';
import {
  getMapView,
  removePersonaFromMap,
  undoChange,
  type MapId,
  type MapRecord,
  type MapRepository,
  type PersonaId,
  type ProductId,
  type TaskId,
} from '../../src/index.ts';

const MAP_ID = 'map_1' as MapId;
const RIDER = 'ps_rider' as PersonaId;

function repository(): MapRepository {
  let record: MapRecord = {
    map: {
      id: MAP_ID,
      name: 'A map',
      teams: [],
      personas: [{ id: RIDER, name: 'Rider', icon: 'person' }],
      activities: [
        {
          id: 'act_1',
          name: 'First',
          tasks: [{ id: 'leaf' as TaskId, name: 'Leaf', personaIds: [RIDER], subtasks: [] }],
        },
      ],
    },
    product: { id: 'prd_1' as ProductId, name: 'A product' },
    ratings: [],
  };
  return {
    find: (id) => Promise.resolve(id === MAP_ID ? record : null),
    save: (next) => {
      record = next;
      return Promise.resolve();
    },
  };
}

describe('removing a persona', () => {
  it('removes it and takes it off its tasks in one save', async () => {
    const maps = repository();
    await removePersonaFromMap({ maps })({ mapId: MAP_ID, personaId: RIDER });
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.personas).toEqual([]);
    expect(view.activities[0]?.tasks[0]?.personaIds).toEqual([]);
  });

  it('hands back the before and after, so undo brings the persona and its tasks back', async () => {
    const maps = repository();
    const { before, after } = await removePersonaFromMap({ maps })({ mapId: MAP_ID, personaId: RIDER });
    await undoChange({ maps })({ mapId: MAP_ID, before, after });
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.personas).toEqual([{ id: RIDER, name: 'Rider', icon: 'person' }]);
    expect(view.activities[0]?.tasks[0]?.personaIds).toEqual([RIDER]);
  });

  it('says so when the map is missing', async () => {
    await expect(
      removePersonaFromMap({ maps: repository() })({ mapId: 'nope' as MapId, personaId: RIDER }),
    ).rejects.toMatchObject({ code: 'MAP_NOT_FOUND' });
  });
});
