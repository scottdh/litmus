import { describe, expect, it } from 'vitest';
import {
  DomainError,
  getMapView,
  rateTask,
  type Clock,
  type Instant,
  type Light,
  type MapId,
  type MapRepository,
  type ProductId,
  type TaskId,
} from '../../src/index.ts';
import { createInMemoryMapRepository } from '../../src/adapters/in-memory/index.ts';

const MAP_ID = 'map_1' as MapId;
const LEAF = 'tsk_leaf' as TaskId;
const PARENT = 'tsk_parent' as TaskId;
const CHILD_A = 'tsk_a' as TaskId;
const CHILD_B = 'tsk_b' as TaskId;
const clock: Clock = { now: () => '2026-11-05T10:00:00.000Z' as Instant };

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
              { id: LEAF, name: 'On its own', subtasks: [] },
              {
                id: PARENT,
                name: 'With children',
                subtasks: [
                  { id: CHILD_A, name: 'One' },
                  { id: CHILD_B, name: 'Two' },
                ],
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

const set = (maps: MapRepository, taskId: TaskId, light: Light, note: string) =>
  rateTask({ maps, clock })({ mapId: MAP_ID, taskId, light, note });

const codeOf = async (attempt: Promise<unknown>) => {
  const error: unknown = await attempt.then(
    () => null,
    (caught: unknown) => caught,
  );
  return error instanceof DomainError ? error.code : null;
};

describe('rating a task', () => {
  it('sets the light and shows the review', async () => {
    const maps = repository();
    await set(maps, LEAF, 'yellow', 'Prices are buried three steps in.');
    const task = (await getMapView({ maps })(MAP_ID)).activities[0]?.tasks[0];
    expect(task?.light).toBe('yellow');
    expect(task?.review).toBe('Prices are buried three steps in.');
  });

  it('refuses green, yellow or red without a review', async () => {
    const maps = repository();
    expect(await codeOf(set(maps, LEAF, 'green', '   '))).toBe('RATING_NEEDS_EVIDENCE');
    expect((await getMapView({ maps })(MAP_ID)).activities[0]?.tasks[0]?.light).toBe('grey');
  });

  it('allows grey and out of scope without a review', async () => {
    const maps = repository();
    await set(maps, LEAF, 'out-of-scope', '');
    const task = (await getMapView({ maps })(MAP_ID)).activities[0]?.tasks[0];
    expect(task?.light).toBe('out-of-scope');
    expect(task?.review).toBeNull();
  });

  it('keeps only the latest review', async () => {
    const maps = repository();
    await set(maps, LEAF, 'red', 'Broken.');
    await set(maps, LEAF, 'yellow', 'Better now.');
    const record = await maps.find(MAP_ID);
    expect(record?.ratings.filter((rating) => rating.subjectId === LEAF)).toHaveLength(1);
    expect((await getMapView({ maps })(MAP_ID)).activities[0]?.tasks[0]?.review).toBe('Better now.');
  });

  it('dates the rating from the clock', async () => {
    const maps = repository();
    await set(maps, LEAF, 'red', 'Broken.');
    const record = await maps.find(MAP_ID);
    expect(record?.ratings[0]?.ratedAt).toBe('2026-11-05T10:00:00.000Z');
  });

  it('rates a subtask, and the parent follows', async () => {
    const maps = repository();
    await set(maps, CHILD_A, 'green', 'Fine.');
    await set(maps, CHILD_B, 'green', 'Also fine.');
    const parent = (await getMapView({ maps })(MAP_ID)).activities[0]?.tasks[1];
    expect(parent?.light).toBe('green');
    expect(parent?.subtasks[0]?.review).toBe('Fine.');
  });

  it('refuses to rate a task with subtasks directly', async () => {
    expect(await codeOf(set(repository(), PARENT, 'green', 'Fine.'))).toBe('PARENT_LIGHT_IS_DERIVED');
  });

  it('refuses a task that does not exist', async () => {
    expect(await codeOf(set(repository(), 'tsk_missing' as TaskId, 'red', 'Broken.'))).toBe('TASK_NOT_FOUND');
  });

  it('refuses a map that does not exist', async () => {
    const attempt = rateTask({ maps: repository(), clock })({
      mapId: 'map_missing' as MapId,
      taskId: LEAF,
      light: 'red',
      note: 'Broken.',
    });
    expect(await codeOf(attempt)).toBe('MAP_NOT_FOUND');
  });
});
