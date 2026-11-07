import { describe, expect, it } from 'vitest';
import {
  DomainError,
  getMapView,
  renameChapter,
  renameTaskInMap,
  type MapId,
  type MapRepository,
  type ProductId,
  type TaskId,
} from '../../src/index.ts';
import { createInMemoryMapRepository } from '../../src/adapters/in-memory/index.ts';

const MAP_ID = 'map_1' as MapId;

function repository(): MapRepository {
  return createInMemoryMapRepository([
    {
      map: {
        id: MAP_ID,
        name: 'A small map',
        teams: [],
        activities: [{ id: 'act_1', name: 'First', tasks: [{ id: 'tsk_1' as TaskId, name: 'A task', subtasks: [] }] }],
      },
      product: { id: 'prd_1' as ProductId, name: 'Thing' },
      ratings: [],
    },
  ]);
}

describe('renaming', () => {
  it('keeps a renamed task', async () => {
    const maps = repository();
    await renameTaskInMap({ maps })({ mapId: MAP_ID, taskId: 'tsk_1' as TaskId, name: 'Renamed' });
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.activities[0]?.tasks[0]?.name).toBe('Renamed');
  });

  it('keeps a renamed chapter', async () => {
    const maps = repository();
    await renameChapter({ maps })({ mapId: MAP_ID, activityId: 'act_1', name: 'Renamed' });
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.activities[0]?.name).toBe('Renamed');
  });

  it('keeps nothing when the name is rejected', async () => {
    const maps = repository();
    await renameTaskInMap({ maps })({ mapId: MAP_ID, taskId: 'tsk_1' as TaskId, name: '' }).catch(() => undefined);
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.activities[0]?.tasks[0]?.name).toBe('A task');
  });

  it('fails with a stable code when the map does not exist', async () => {
    const error: unknown = await renameChapter({ maps: repository() })({
      mapId: 'map_missing' as MapId,
      activityId: 'act_1',
      name: 'Renamed',
    }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).code).toBe('MAP_NOT_FOUND');
  });
});
