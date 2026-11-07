import { describe, expect, it } from 'vitest';
import {
  getMapView,
  removeTeamFromMap,
  undoChange,
  type MapId,
  type MapRecord,
  type MapRepository,
  type ProductId,
  type TaskId,
  type TeamId,
} from '../../src/index.ts';

const MAP_ID = 'map_1' as MapId;
const BENCH = 'tm_bench' as TeamId;

function repository(): MapRepository {
  let record: MapRecord = {
    map: {
      id: MAP_ID,
      name: 'A map',
      teams: [{ id: BENCH, name: 'Bench' }],
      personas: [],
      activities: [
        { id: 'act_1', name: 'First', tasks: [{ id: 'leaf' as TaskId, name: 'Leaf', teamId: BENCH, subtasks: [] }] },
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

describe('removing a team', () => {
  it('removes it and clears it from its tasks in one save', async () => {
    const maps = repository();
    await removeTeamFromMap({ maps })({ mapId: MAP_ID, teamId: BENCH });
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.teams).toEqual([]);
    expect(view.activities[0]?.tasks[0]?.teamId).toBeNull();
  });

  it('hands back the before and after, so undo brings the team and its tasks back', async () => {
    const maps = repository();
    const { before, after } = await removeTeamFromMap({ maps })({ mapId: MAP_ID, teamId: BENCH });
    await undoChange({ maps })({ mapId: MAP_ID, before, after });
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.teams).toEqual([{ id: BENCH, name: 'Bench' }]);
    expect(view.activities[0]?.tasks[0]?.teamId).toBe(BENCH);
  });

  it('says so when the map is missing', async () => {
    await expect(
      removeTeamFromMap({ maps: repository() })({ mapId: 'nope' as MapId, teamId: BENCH }),
    ).rejects.toMatchObject({
      code: 'MAP_NOT_FOUND',
    });
  });
});
