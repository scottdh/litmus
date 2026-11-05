import { describe, expect, it } from 'vitest';
import {
  addChapter,
  addTaskToMap,
  getMapView,
  type MapId,
  type MapRecord,
  type MapRepository,
  type ProductId,
  type TaskId,
} from '../../src/index.ts';

const MAP_ID = 'map_1' as MapId;

function repository(): MapRepository {
  let record: MapRecord = {
    map: {
      id: MAP_ID,
      name: 'A map',
      activities: [{ id: 'act_1', name: 'First', tasks: [{ id: 'leaf' as TaskId, name: 'Leaf', subtasks: [] }] }],
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

const newId = () => 'new';

describe('adding to a map', () => {
  it('saves a new task, which starts grey', async () => {
    const maps = repository();
    const { id } = await addTaskToMap({ maps, newId })({ mapId: MAP_ID, name: 'Fresh', to: { chapterId: 'act_1' } });
    const view = await getMapView({ maps })(MAP_ID);
    expect(id).toBe('tsk_new');
    expect(view.activities[0]?.tasks[1]).toMatchObject({ id: 'tsk_new', name: 'Fresh', light: 'grey', review: null });
  });

  it('saves a new subtask', async () => {
    const maps = repository();
    await addTaskToMap({ maps, newId })({ mapId: MAP_ID, name: 'Fresh', to: { parentId: 'leaf' as TaskId } });
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.activities[0]?.tasks[0]?.subtasks.map((sub) => sub.name)).toEqual(['Fresh']);
  });

  it('saves a new chapter, in place', async () => {
    const maps = repository();
    const { id } = await addChapter({ maps, newId })({ mapId: MAP_ID, name: 'Fresh', before: 'act_1' });
    const view = await getMapView({ maps })(MAP_ID);
    expect(id).toBe('act_new');
    expect(view.activities.map((activity) => activity.name)).toEqual(['Fresh', 'First']);
  });

  it('hands back the map from before and after, so the add can be undone', async () => {
    const maps = repository();
    const { before, after } = await addChapter({ maps, newId })({ mapId: MAP_ID, name: 'Fresh', before: null });
    expect(before.map.activities).toHaveLength(1);
    expect(after.map.activities).toHaveLength(2);
  });

  it('reports a map that does not exist', async () => {
    const error: unknown = await addChapter({ maps: repository(), newId })({
      mapId: 'nope' as MapId,
      name: 'Fresh',
      before: null,
    }).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ code: 'MAP_NOT_FOUND' });
  });
});
