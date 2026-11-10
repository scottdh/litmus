import { describe, expect, it } from 'vitest';
import {
  DomainError,
  getTaskView,
  rateTask,
  undoChange,
  type Clock,
  type Instant,
  type Light,
  type MapId,
  type MapRepository,
  type ProductId,
  type StepId,
  type TaskId,
} from '../../src/index.ts';
import { createInMemoryMapRepository } from '../../src/adapters/in-memory/index.ts';

const MAP_ID = 'map_1' as MapId;
const FIRST = 'tsk_first' as TaskId;
const PARENT = 'tsk_parent' as TaskId;
const LAST = 'tsk_last' as TaskId;
const SUB_A = 'tsk_a' as TaskId;
const SUB_B = 'tsk_b' as TaskId;
const SUB_C = 'tsk_c' as TaskId;
const LATER = 'tsk_later' as TaskId;

function repository(): MapRepository {
  return createInMemoryMapRepository([
    {
      map: {
        id: MAP_ID,
        name: 'A small map',
        teams: [],
        personas: [],
        activities: [
          {
            id: 'act_1',
            name: 'Arrive',
            tasks: [
              { id: FIRST, name: 'Book in', subtasks: [] },
              {
                id: PARENT,
                name: 'Diagnose',
                subtasks: [
                  { id: SUB_A, name: 'Look it over', steps: [] },
                  {
                    id: SUB_B,
                    name: 'Test ride',
                    steps: [
                      { id: 'stp_1' as StepId, name: 'Pump the tyres', note: '' },
                      { id: 'stp_2' as StepId, name: 'Ride the block', note: '' },
                      { id: 'stp_3' as StepId, name: 'Write it up', note: '' },
                    ],
                  },
                  { id: SUB_C, name: 'Quote', steps: [] },
                ],
              },
              { id: LAST, name: 'Hand over', subtasks: [] },
            ],
          },
          { id: 'act_2', name: 'Leave', tasks: [{ id: LATER, name: 'Pay', subtasks: [] }] },
        ],
      },
      product: { id: 'prd_1' as ProductId, name: 'Thing' },
      ratings: [],
    },
  ]);
}

function rater(maps: MapRepository) {
  let day = 0;
  const clock: Clock = { now: () => `2026-11-0${String(++day)}T10:00:00.000Z` as Instant };
  return (taskId: TaskId, light: Light, note: string) =>
    rateTask({ maps, clock })({ mapId: MAP_ID, taskId, light, note });
}

const view = (maps: MapRepository, id: string) => getTaskView({ maps })({ mapId: MAP_ID, id });

describe('getTaskView', () => {
  describe('a task', () => {
    it('gives its name, chapter and light, with nothing above it', async () => {
      const page = await view(repository(), FIRST);
      expect(page).toMatchObject({
        id: FIRST,
        name: 'Book in',
        kind: 'task',
        chapter: { id: 'act_1', name: 'Arrive', number: 1 },
        path: [],
        light: 'grey',
        history: [],
      });
    });

    it('gives its siblings in story order, and nothing past the ends of its chapter', async () => {
      const maps = repository();
      expect(await view(maps, PARENT)).toMatchObject({
        before: { id: FIRST, name: 'Book in' },
        after: { id: LAST, name: 'Hand over' },
      });
      expect(await view(maps, FIRST)).toMatchObject({ before: null });
      expect(await view(maps, LAST)).toMatchObject({ after: null });
      expect(await view(maps, LATER)).toMatchObject({ chapter: { number: 2 }, before: null, after: null });
    });

    it('lists every change to its light, newest first, with what it moved from and its note', async () => {
      const maps = repository();
      const rate = rater(maps);
      await rate(FIRST, 'red', 'Can’t find a free slot.');
      await rate(FIRST, 'yellow', 'Slots show, but only for today.');
      await rate(FIRST, 'yellow', 'Checked again on the new build.');
      await rate(FIRST, 'grey', '');

      const page = await view(maps, FIRST);
      expect(page.light).toBe('grey');
      expect(page.history).toEqual([
        { ratedAt: '2026-11-04T10:00:00.000Z', from: 'yellow', to: 'grey', note: null, cause: null },
        {
          ratedAt: '2026-11-03T10:00:00.000Z',
          from: 'yellow',
          to: 'yellow',
          note: 'Checked again on the new build.',
          cause: null,
        },
        {
          ratedAt: '2026-11-02T10:00:00.000Z',
          from: 'red',
          to: 'yellow',
          note: 'Slots show, but only for today.',
          cause: null,
        },
        { ratedAt: '2026-11-01T10:00:00.000Z', from: 'grey', to: 'red', note: 'Can’t find a free slot.', cause: null },
      ]);
    });

    it('drops the entry a rating added when the rating is undone', async () => {
      const maps = repository();
      const rate = rater(maps);
      await rate(FIRST, 'red', 'Broken.');
      const { before, after } = await rate(FIRST, 'green', 'Fixed.');
      await undoChange({ maps })({ mapId: MAP_ID, before, after });
      const page = await view(maps, FIRST);
      expect(page.history.map((entry) => entry.to)).toEqual(['red']);
    });
  });

  describe('a task with subtasks', () => {
    it('replays its history from its subtasks, naming the one that moved it, only when its light changed', async () => {
      const maps = repository();
      const rate = rater(maps);
      await rate(SUB_A, 'red', 'No checklist.');
      await rate(SUB_B, 'red', 'Can’t log the ride.');
      await rate(SUB_C, 'green', 'Quotes in two taps.');
      await rate(SUB_A, 'green', 'Checklist added.');

      const page = await view(maps, PARENT);
      expect(page.light).toBe('yellow');
      expect(page.history).toEqual([
        {
          ratedAt: '2026-11-03T10:00:00.000Z',
          from: 'red',
          to: 'yellow',
          note: 'Quotes in two taps.',
          cause: { id: SUB_C, name: 'Quote' },
        },
        {
          ratedAt: '2026-11-01T10:00:00.000Z',
          from: 'grey',
          to: 'red',
          note: 'No checklist.',
          cause: { id: SUB_A, name: 'Look it over' },
        },
      ]);
    });
  });

  describe('a subtask', () => {
    it('sits under its task, beside the task’s other subtasks, with a log of its own', async () => {
      const maps = repository();
      await rater(maps)(SUB_B, 'red', 'Can’t log the ride.');
      const page = await view(maps, SUB_B);
      expect(page).toMatchObject({
        kind: 'subtask',
        chapter: { number: 1 },
        path: [{ id: PARENT, name: 'Diagnose' }],
        before: { id: SUB_A, name: 'Look it over' },
        after: { id: SUB_C, name: 'Quote' },
        light: 'red',
        history: [{ from: 'grey', to: 'red', note: 'Can’t log the ride.', cause: null }],
      });
    });
  });

  describe('a step', () => {
    it('sits under its subtask, beside its other steps, and takes no light or history', async () => {
      const page = await view(repository(), 'stp_2');
      expect(page).toEqual({
        id: 'stp_2',
        name: 'Ride the block',
        kind: 'step',
        chapter: { id: 'act_1', name: 'Arrive', number: 1 },
        path: [
          { id: PARENT, name: 'Diagnose' },
          { id: SUB_B, name: 'Test ride' },
        ],
        before: { id: 'stp_1', name: 'Pump the tyres' },
        after: { id: 'stp_3', name: 'Write it up' },
        light: null,
        history: [],
      });
    });
  });

  it('fails with a stable code for something not on the map', async () => {
    const error: unknown = await view(repository(), 'tsk_missing').catch((caught: unknown) => caught);
    expect((error as DomainError).code).toBe('TASK_NOT_FOUND');
  });

  it('fails with a stable code when the map does not exist', async () => {
    const error: unknown = await getTaskView({ maps: repository() })({
      mapId: 'map_missing' as MapId,
      id: FIRST,
    }).catch((caught: unknown) => caught);
    expect((error as DomainError).code).toBe('MAP_NOT_FOUND');
  });
});
