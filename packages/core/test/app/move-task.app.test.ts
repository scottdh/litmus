import { describe, expect, it } from 'vitest';
import {
  createRating,
  DomainError,
  getMapView,
  moveTask,
  renameTaskInMap,
  undoMove,
  type Evidence,
  type Instant,
  type Light,
  type MapId,
  type MapRepository,
  type ProductId,
  type TaskId,
} from '../../src/index.ts';
import { createInMemoryMapRepository } from '../../src/adapters/in-memory/index.ts';

const MAP_ID = 'map_1' as MapId;
const PRODUCT_ID = 'prd_1' as ProductId;
const id = (value: string) => value as TaskId;
const note = (text: string): Evidence[] => [{ kind: 'note', text }];

const rated = (subject: string, light: Light, text: string) =>
  createRating({
    subjectId: id(subject),
    productId: PRODUCT_ID,
    light,
    evidence: note(text),
    ratedAt: '2026-11-04T09:00:00.000Z' as Instant,
  });

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
              { id: id('a'), name: 'A', subtasks: [] },
              { id: id('b'), name: 'B', subtasks: [] },
              { id: id('p'), name: 'P', subtasks: [{ id: id('p1'), name: 'P1' }] },
            ],
          },
        ],
      },
      product: { id: PRODUCT_ID, name: 'Thing' },
      ratings: [
        rated('a', 'green', 'A is fine.'),
        rated('b', 'red', 'B is broken.'),
        rated('p1', 'yellow', 'P1 is ok.'),
      ],
    },
  ]);
}

const viewOf = async (maps: MapRepository) => {
  const tasks = (await getMapView({ maps })(MAP_ID)).activities[0]?.tasks ?? [];
  return (name: string) => tasks.find((task) => task.name === name);
};

describe('moving tasks', () => {
  it('saves the move', async () => {
    const maps = repository();
    await moveTask({ maps })({ mapId: MAP_ID, taskId: id('b'), to: { chapterId: 'act_1', before: id('a') } });
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.activities[0]?.tasks.map((task) => task.name)).toEqual(['B', 'A', 'P']);
  });

  it('keeps a task’s own rating when it moves', async () => {
    const maps = repository();
    await moveTask({ maps })({ mapId: MAP_ID, taskId: id('a'), to: { parentId: id('p'), before: null } });
    const moved = (await viewOf(maps))('P')?.subtasks.find((sub) => sub.name === 'A');
    expect(moved?.light).toBe('green');
    expect(moved?.review).toBe('A is fine.');
  });

  it('fails with a stable code when the map does not exist', async () => {
    const error: unknown = await moveTask({ maps: repository() })({
      mapId: 'map_missing' as MapId,
      taskId: id('a'),
      to: { chapterId: 'act_1', before: null },
    }).catch((caught: unknown) => caught);
    expect((error as DomainError).code).toBe('MAP_NOT_FOUND');
  });
});

describe('a task that becomes a parent', () => {
  it('takes its light from its subtasks, and keeps its old review as an earlier one', async () => {
    const maps = repository();
    await moveTask({ maps })({ mapId: MAP_ID, taskId: id('a'), to: { parentId: id('b'), before: null } });
    const parent = (await viewOf(maps))('B');
    expect(parent?.light).toBe('green');
    expect(parent?.review).toBeNull();
    expect(parent?.earlierReview).toBe('B is broken.');
  });

  it('has no earlier review if it was never rated', async () => {
    const task = (await viewOf(repository()))('P');
    expect(task?.earlierReview).toBeNull();
  });

  it('a plain task has no earlier review', async () => {
    const task = (await viewOf(repository()))('A');
    expect(task?.earlierReview).toBeNull();
  });
});

describe('a parent that loses its last child', () => {
  it('becomes a plain task showing grey', async () => {
    const maps = repository();
    await moveTask({ maps })({ mapId: MAP_ID, taskId: id('p1'), to: { chapterId: 'act_1', before: null } });
    const task = (await viewOf(maps))('P');
    expect(task?.subtasks).toEqual([]);
    expect(task?.light).toBe('grey');
    expect(task?.review).toBeNull();
  });

  it('shows grey even if it had its own rating from before it was a parent', async () => {
    const maps = repository();
    await moveTask({ maps })({ mapId: MAP_ID, taskId: id('a'), to: { parentId: id('b'), before: null } });
    await moveTask({ maps })({ mapId: MAP_ID, taskId: id('a'), to: { chapterId: 'act_1', before: null } });
    const task = (await viewOf(maps))('B');
    expect(task?.light).toBe('grey');
    expect(task?.earlierReview).toBeNull();
  });
});

describe('undoing a move', () => {
  it('puts everything back, including a cleared rating', async () => {
    const maps = repository();
    const move = await moveTask({ maps })({ mapId: MAP_ID, taskId: id('a'), to: { parentId: id('b'), before: null } });
    const second = await moveTask({ maps })({
      mapId: MAP_ID,
      taskId: id('a'),
      to: { chapterId: 'act_1', before: null },
    });
    await undoMove({ maps })({ mapId: MAP_ID, ...second });
    const parent = (await viewOf(maps))('B');
    expect(parent?.subtasks.map((sub) => sub.name)).toEqual(['A']);
    expect(parent?.earlierReview).toBe('B is broken.');
    await undoMove({ maps })({ mapId: MAP_ID, ...move });
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.activities[0]?.tasks.map((task) => task.name)).toEqual(['A', 'B', 'P']);
    expect(view.activities[0]?.tasks[1]?.light).toBe('red');
  });

  it('refuses if the map has changed since, rather than losing that change', async () => {
    const maps = repository();
    const move = await moveTask({ maps })({ mapId: MAP_ID, taskId: id('a'), to: { chapterId: 'act_1', before: null } });
    await renameTaskInMap({ maps })({ mapId: MAP_ID, taskId: id('b'), name: 'Renamed' });
    const error: unknown = await undoMove({ maps })({ mapId: MAP_ID, ...move }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).code).toBe('UNDO_OUT_OF_DATE');
    expect((await viewOf(maps))('Renamed')).toBeDefined();
  });
});
