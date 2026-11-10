import { describe, expect, it } from 'vitest';
import {
  DomainError,
  createRating,
  getMapView,
  type Evidence,
  type Instant,
  type Light,
  type MapId,
  type ProductId,
  type StepId,
  type StoryMap,
  type TaskId,
} from '../../src/index.ts';
import {
  SAMPLE_MAP_ID,
  createInMemoryMapRepository,
  createSampleMapRepository,
} from '../../src/adapters/in-memory/index.ts';

const MAP_ID = 'map_1' as MapId;
const PRODUCT_ID = 'prd_1' as ProductId;
const evidence: Evidence[] = [{ kind: 'heuristic-review', violations: [] }];
const id = (value: string) => value as TaskId;

const map: StoryMap = {
  id: MAP_ID,
  name: 'A small map',
  teams: [],
  personas: [],
  activities: [
    {
      id: 'act_z',
      name: 'Zebra comes first',
      tasks: [
        { id: id('tsk_leaf'), name: 'A task on its own', subtasks: [] },
        {
          id: id('tsk_parent'),
          name: 'A task with subtasks',
          subtasks: [
            { id: id('tsk_a'), name: 'Works', steps: [] },
            { id: id('tsk_b'), name: 'Fails', steps: [{ id: 'stp_1' as StepId, name: 'A step', note: 'A note' }] },
          ],
        },
        { id: id('tsk_unrated'), name: 'Not judged yet', subtasks: [] },
      ],
    },
    { id: 'act_a', name: 'Aardvark comes second', tasks: [] },
  ],
};

function rating(subject: string, light: Light, ratedAt = '2026-11-04T09:00:00.000Z') {
  const needsEvidence = light === 'green' || light === 'yellow' || light === 'red';
  return createRating({
    subjectId: id(subject),
    productId: PRODUCT_ID,
    light,
    evidence: needsEvidence ? evidence : [],
    ratedAt: ratedAt as Instant,
  });
}

const maps = createInMemoryMapRepository([
  {
    map,
    product: { id: PRODUCT_ID, name: 'Thing' },
    ratings: [
      rating('tsk_leaf', 'yellow'),
      rating('tsk_a', 'green'),
      rating('tsk_b', 'red'),
      rating('tsk_parent', 'green'),
    ],
  },
]);

describe('getMapView', () => {
  it('keeps activities and tasks in narrative order', async () => {
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.activities.map((activity) => activity.name)).toEqual(['Zebra comes first', 'Aardvark comes second']);
    expect(view.activities[0]?.tasks.map((task) => task.name)).toEqual([
      'A task on its own',
      'A task with subtasks',
      'Not judged yet',
    ]);
  });

  it('gives a task without subtasks its own rating', async () => {
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.activities[0]?.tasks[0]?.light).toBe('yellow');
  });

  it('derives a parent from its subtasks, even if it has a rating of its own', async () => {
    const view = await getMapView({ maps })(MAP_ID);
    const parent = view.activities[0]?.tasks[1];
    expect(parent?.light).toBe('yellow');
    expect(parent?.subtasks.map((sub) => sub.light)).toEqual(['green', 'red']);
  });

  it('shows a subtask’s steps, and leaves its light and every mix to the ratings', async () => {
    const view = await getMapView({ maps })(MAP_ID);
    const parent = view.activities[0]?.tasks[1];
    expect(parent?.subtasks[1]?.steps).toEqual([
      { id: 'stp_1', name: 'A step', note: 'A note', personaIds: [], research: null },
    ]);
    expect(parent?.subtasks[1]?.light).toBe('red');
    expect(parent?.mix).toEqual([
      { light: 'green', count: 1 },
      { light: 'red', count: 1 },
    ]);
  });

  it('reads the latest rating for each task by when it was made, not where it sits in the log', async () => {
    const logged = createInMemoryMapRepository([
      {
        map,
        product: { id: PRODUCT_ID, name: 'Thing' },
        ratings: [
          rating('tsk_leaf', 'green', '2026-11-06T09:00:00.000Z'),
          rating('tsk_leaf', 'red', '2026-11-02T09:00:00.000Z'),
          rating('tsk_a', 'red', '2026-11-01T09:00:00.000Z'),
          rating('tsk_a', 'green', '2026-11-03T09:00:00.000Z'),
        ],
      },
    ]);
    const tasks = (await getMapView({ maps: logged })(MAP_ID)).activities[0]?.tasks;
    expect(tasks?.[0]?.light).toBe('green');
    expect(tasks?.[1]?.subtasks[0]?.light).toBe('green');
  });

  it('shows anything unrated as grey', async () => {
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.activities[0]?.tasks[2]?.light).toBe('grey');
  });

  it('gives counts for the mix, in a fixed order, and no percentages', async () => {
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.activities[0]?.mix).toEqual([
      { light: 'yellow', count: 2 },
      { light: 'grey', count: 1 },
    ]);
    expect(view.activities[0]?.tasks[1]?.mix).toEqual([
      { light: 'green', count: 1 },
      { light: 'red', count: 1 },
    ]);
    expect(view.activities[1]?.mix).toEqual([]);
  });

  it('fails with a stable code when the map does not exist', async () => {
    const error: unknown = await getMapView({ maps })('map_missing' as MapId).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).code).toBe('MAP_NOT_FOUND');
  });

  it('loads the sample map through the same rules', async () => {
    const view = await getMapView({ maps: createSampleMapRepository() })(SAMPLE_MAP_ID);
    expect(view.activities.length).toBeGreaterThan(0);
    expect(view.activities.at(-1)?.tasks).toEqual([]);
  });
});
