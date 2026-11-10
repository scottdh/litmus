import type { HistoryEntry, Instant, MapView, TaskView } from '@litmus/core';
import { describe, expect, it } from 'vitest';
import { formatDay, historyLines, outlineFor } from './model';

const task = (id: string, subtasks: TaskView['subtasks'] = []): TaskView => ({
  id,
  name: id,
  teamId: null,
  ownPersonaIds: [],
  personaIds: [],
  light: 'grey',
  review: null,
  earlierReview: null,
  research: null,
  subtasks,
  mix: [],
});

const subtask = (id: string, stepIds: string[] = []): TaskView['subtasks'][number] => ({
  id,
  name: id,
  light: 'red',
  review: null,
  teamId: null,
  ownTeamId: null,
  ownPersonaIds: [],
  personaIds: [],
  research: null,
  steps: stepIds.map((stepId) => ({ id: stepId, name: stepId, note: '', personaIds: [], research: null })),
});

const map: MapView = {
  id: 'map_1',
  name: 'A small map',
  productName: 'Thing',
  teams: [],
  personas: [],
  activities: [
    {
      id: 'act_1',
      name: 'Arrive',
      mix: [],
      tasks: [
        task('book'),
        task('diagnose', [subtask('look'), subtask('ride', ['pump', 'block']), subtask('quote', ['price'])]),
        task('hand', [subtask('wash', ['rinse'])]),
      ],
    },
    { id: 'act_2', name: 'Leave', mix: [], tasks: [task('pay', [subtask('card', ['tap'])])] },
  ],
};

const shown = (id: string) =>
  outlineFor(map, id).map((chapter) => ({
    open: chapter.open,
    tasks: chapter.tasks.map((row) => ({
      id: row.id,
      current: row.current,
      subtasks: row.subtasks.map((sub) => ({
        id: sub.id,
        current: sub.current,
        steps: sub.steps.map((step) => `${step.id}${step.current ? ' (here)' : ''}`),
      })),
    })),
  }));

describe('outlineFor', () => {
  it('lists every chapter by number and name, opening only the one holding the page', () => {
    const outline = outlineFor(map, 'book');
    expect(outline.map(({ number, name, open }) => ({ number, name, open }))).toEqual([
      { number: 1, name: 'Arrive', open: true },
      { number: 2, name: 'Leave', open: false },
    ]);
  });

  it('opens nothing below a task that has no subtasks', () => {
    expect(shown('book')[0]?.tasks.every((row) => row.subtasks.length === 0)).toBe(true);
    expect(shown('book')[0]?.tasks[0]?.current).toBe(true);
  });

  it('opens a parent to its subtasks, but not its subtasks to their steps', () => {
    const [arrive] = shown('diagnose');
    expect(arrive?.tasks[1]).toEqual({
      id: 'diagnose',
      current: true,
      subtasks: [
        { id: 'look', current: false, steps: [] },
        { id: 'ride', current: false, steps: [] },
        { id: 'quote', current: false, steps: [] },
      ],
    });
    expect(arrive?.tasks[2]?.subtasks).toEqual([]);
  });

  it('opens only the subtask holding a step, down to its steps', () => {
    const [arrive, leave] = shown('block');
    expect(arrive?.tasks[1]?.current).toBe(false);
    expect(arrive?.tasks[1]?.subtasks).toEqual([
      { id: 'look', current: false, steps: [] },
      { id: 'ride', current: false, steps: ['pump', 'block (here)'] },
      { id: 'quote', current: false, steps: [] },
    ]);
    expect(leave?.tasks[0]?.subtasks).toEqual([]);
  });

  it('opens a subtask to its steps when it is the page', () => {
    const [, leave] = shown('card');
    expect(leave).toEqual({
      open: true,
      tasks: [{ id: 'pay', current: false, subtasks: [{ id: 'card', current: true, steps: ['tap'] }] }],
    });
  });
});

const entry = (overrides: Partial<HistoryEntry>): HistoryEntry => ({
  ratedAt: '2026-11-04T10:00:00.000Z' as Instant,
  from: 'grey',
  to: 'red',
  note: null,
  cause: null,
  ...overrides,
});

describe('historyLines', () => {
  it('shows nothing for a step, which takes no light', () => {
    expect(historyLines(null, [])).toEqual([]);
  });

  it('shows one entry, "Added, grey", when the light has never changed', () => {
    expect(historyLines('grey', [])).toEqual([
      { key: 'added', ratedAt: null, light: 'grey', move: 'Added, grey', note: null, cause: null },
    ]);
  });

  it('words each move up or down, keeps the order it was given, and ends with the add', () => {
    const lines = historyLines('red', [
      entry({ from: 'yellow', to: 'red', note: 'It broke again.' }),
      entry({ from: 'red', to: 'yellow' }),
      entry({ from: 'grey', to: 'red' }),
    ]);
    expect(lines.map((line) => line.move)).toEqual([
      'Red, down from yellow',
      'Yellow, up from red',
      'Red, up from grey',
      'Added, grey',
    ]);
    expect(lines[0]?.note).toBe('It broke again.');
  });

  it('says only the review changed when the light stayed put', () => {
    expect(historyLines('red', [entry({ from: 'red', to: 'red' })])[0]?.move).toBe('Review updated');
  });

  it('neither ranks out of scope above nor below a light', () => {
    const lines = historyLines('yellow', [
      entry({ from: 'out-of-scope', to: 'yellow' }),
      entry({ from: 'green', to: 'out-of-scope' }),
    ]);
    expect(lines.map((line) => line.move).slice(0, 2)).toEqual([
      'Yellow, from out of scope',
      'Out of scope, from green',
    ]);
  });

  it('keeps the subtask that moved a parent', () => {
    const cause = { id: 'look', name: 'Look it over' };
    expect(historyLines('red', [entry({ cause })])[0]?.cause).toEqual(cause);
  });
});

describe('formatDay', () => {
  it('writes the day and the short month', () => {
    expect(formatDay('2026-11-04T23:30:00.000Z' as Instant)).toBe('4 Nov');
  });
});
