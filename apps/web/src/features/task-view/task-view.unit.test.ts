import type { HistoryEntry, Instant, Light, MapView, ResearchView, TaskPageView, TaskView } from '@litmus/core';
import { describe, expect, it } from 'vitest';
import { formatDay, growingLine, historyLines, outlineFor, researchMessage, taskViewModel } from './model';

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

const page = (id: string, kind: TaskPageView['kind'], light: Light | null): TaskPageView => ({
  id,
  name: id,
  kind,
  chapter: { id: 'act_1', name: 'Arrive', number: 1 },
  path: [],
  before: null,
  after: null,
  light,
  history: [],
});

describe('taskViewModel', () => {
  it('carries the map it belongs to, so the page can set a light on it', () => {
    expect(taskViewModel(map, page('book', 'task', 'grey'))?.mapId).toBe('map_1');
  });

  it('lets a task or a subtask without subtasks take a light here', () => {
    expect(taskViewModel(map, page('book', 'task', 'grey'))?.rateable).toBe(true);
    expect(taskViewModel(map, page('look', 'subtask', 'red'))?.rateable).toBe(true);
  });

  it('never lets a parent take a light here, as its subtasks set it', () => {
    expect(taskViewModel(map, page('diagnose', 'task', 'red'))?.rateable).toBe(false);
  });

  it('never lets a step take a light, as steps have none', () => {
    expect(taskViewModel(map, page('pump', 'step', null))?.rateable).toBe(false);
  });

  it('reads pain points, every quote and ideas as flat lists, in order', () => {
    const research: ResearchView = {
      summary: '  What the task is.  ',
      pains: [
        { id: 'pain_1', text: 'Counts drift.' },
        { id: 'pain_2', text: 'Nobody hears.' },
      ],
      hearing: [
        { id: 'qt_1', text: 'I walk over.', personaId: null, participant: 'P3, mechanic' },
        { id: 'qt_2', text: 'It said four.', personaId: null, participant: 'P5, mechanic' },
      ],
      ideas: [{ id: 'idea_1', text: 'Show how fresh it is.' }],
    };
    const withResearch: MapView = {
      ...map,
      activities: map.activities.map((chapter) => ({
        ...chapter,
        tasks: chapter.tasks.map((row) => (row.id === 'book' ? { ...row, research } : row)),
      })),
    };
    const model = taskViewModel(withResearch, page('book', 'task', 'grey'));
    expect(model?.summary).toBe('What the task is.');
    expect(model?.pains.map((pain) => pain.id)).toEqual(['pain_1', 'pain_2']);
    expect(model?.hearing.map((quote) => quote.id)).toEqual(['qt_1', 'qt_2']);
    expect(model?.ideas).toEqual([{ id: 'idea_1', text: 'Show how fresh it is.' }]);
  });
});

describe('growingLine', () => {
  it('says nothing up to five pain points or six quotes', () => {
    expect(growingLine('pains', 5)).toBeNull();
    expect(growingLine('hearing', 6)).toBeNull();
    expect(growingLine('ideas', 20)).toBeNull();
  });

  it('suggests sharpening past them', () => {
    expect(growingLine('pains', 6)).toBe('6 pain points. Fewer, sharper ones read better than many.');
    expect(growingLine('hearing', 7)).toBe('7 voices. A few that say it clearly beat many that say it twice.');
  });
});

describe('researchMessage', () => {
  it('says what was added or removed, naming who said a quote', () => {
    expect(researchMessage('add', 'pains')).toBe('Added a pain point');
    expect(researchMessage('remove', 'pains')).toBe('Removed a pain point');
    expect(researchMessage('add', 'hearing', 'P9, mechanic')).toBe('Added what P9, mechanic said');
    expect(researchMessage('remove', 'hearing', 'P3, mechanic')).toBe('Removed what P3, mechanic said');
    expect(researchMessage('add', 'ideas')).toBe('Added an idea');
    expect(researchMessage('remove', 'ideas')).toBe('Removed an idea');
  });
});
