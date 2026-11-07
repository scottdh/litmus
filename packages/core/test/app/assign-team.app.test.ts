import { describe, expect, it } from 'vitest';
import {
  DomainError,
  addTaskToMap,
  assignTeamInMap,
  getMapView,
  undoChange,
  type MapId,
  type MapRepository,
  type ProductId,
  type TaskId,
  type TeamId,
} from '../../src/index.ts';
import { createInMemoryMapRepository } from '../../src/adapters/in-memory/index.ts';

const MAP_ID = 'map_1' as MapId;
const BENCH = 'tm_bench' as TeamId;

function repository(): MapRepository {
  return createInMemoryMapRepository([
    {
      map: {
        id: MAP_ID,
        name: 'A small map',
        teams: [{ id: BENCH, name: 'Bench' }],
        activities: [
          {
            id: 'act_1',
            name: 'First',
            tasks: [
              {
                id: 'tsk_1' as TaskId,
                name: 'A task',
                subtasks: [{ id: 'tsk_1a' as TaskId, name: 'A subtask', steps: [] }],
              },
            ],
          },
        ],
      },
      product: { id: 'prd_1' as ProductId, name: 'Thing' },
      ratings: [],
    },
  ]);
}

describe('teams', () => {
  it('lists the map’s teams, and a task starts with none', async () => {
    const view = await getMapView({ maps: repository() })(MAP_ID);
    expect(view.teams).toEqual([{ id: BENCH, name: 'Bench' }]);
    expect(view.activities[0]?.tasks[0]?.teamId).toBeNull();
  });

  it('keeps a task’s team', async () => {
    const maps = repository();
    await assignTeamInMap({ maps })({ mapId: MAP_ID, taskId: 'tsk_1' as TaskId, teamId: BENCH });
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.activities[0]?.tasks[0]?.teamId).toBe(BENCH);
  });

  it('refuses a team for a subtask, with a stable code', async () => {
    const maps = repository();
    const assigning = assignTeamInMap({ maps })({ mapId: MAP_ID, taskId: 'tsk_1a' as TaskId, teamId: BENCH });
    await expect(assigning).rejects.toBeInstanceOf(DomainError);
    await expect(assigning).rejects.toMatchObject({ code: 'TEAM_IS_ON_THE_TASK' });
  });

  it('adds a task for a team in one change, so undo still takes it away', async () => {
    const maps = repository();
    const { id, before, after } = await addTaskToMap({ maps, newId: () => 'new' })({
      mapId: MAP_ID,
      name: 'New',
      to: { chapterId: 'act_1' },
      teamId: BENCH,
    });
    const added = (await getMapView({ maps })(MAP_ID)).activities[0]?.tasks.find((task) => task.id === id);
    expect(added?.teamId).toBe(BENCH);

    await undoChange({ maps })({ mapId: MAP_ID, before, after });
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.activities[0]?.tasks.map((task) => task.id)).toEqual(['tsk_1']);
  });
});
