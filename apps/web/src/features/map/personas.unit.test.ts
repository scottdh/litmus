import type { ActivityView, SubtaskView, TaskView } from '@litmus/core';
import { describe, expect, it } from 'vitest';
import {
  chaptersWithPicks,
  isChildOffPersona,
  isOffPick,
  isOffPersona,
  personaChipLabel,
  personaForNewTask,
  personaSummary,
  personaTaskCount,
} from './personas';
import { NO_TEAM } from './teams';

const sub = (id: string, personaIds: string[]): SubtaskView => ({
  id,
  name: id,
  light: 'grey',
  review: null,
  teamId: null,
  ownTeamId: null,
  ownPersonaIds: personaIds,
  personaIds,
  steps: [],
});

const task = (id: string, personaIds: string[], teamId: string | null = null): TaskView => ({
  id,
  name: id,
  teamId,
  ownPersonaIds: personaIds,
  personaIds,
  light: 'grey',
  review: null,
  earlierReview: null,
  subtasks: [],
  mix: [],
});

const chapter = (id: string, tasks: TaskView[]): ActivityView => ({ id, name: id, tasks, mix: [] });

const activities = [
  chapter('act_1', [task('a', ['rider'], 'bench'), task('b', ['desk'])]),
  chapter('act_2', [task('c', ['rider', 'desk'], 'till')]),
  chapter('act_3', [task('d', [])]),
];

describe('isOffPersona', () => {
  it('fades nothing while no persona is picked', () => {
    expect(isOffPersona(task('d', []), new Set())).toBe(false);
  });

  it('fades a task unless its roll-up includes a picked persona', () => {
    const picked = new Set(['desk', 'owner']);
    expect(isOffPersona(task('b', ['desk']), picked)).toBe(false);
    expect(isOffPersona(task('a', ['rider']), picked)).toBe(true);
    expect(isOffPersona(task('d', []), picked)).toBe(true);
  });
});

describe('isChildOffPersona', () => {
  it('fades a subtask or step whose personas are all unpicked', () => {
    expect(isChildOffPersona(sub('s', ['rider']).personaIds, new Set(['desk']))).toBe(true);
  });

  it('keeps one with a picked persona', () => {
    expect(isChildOffPersona(['rider', 'desk'], new Set(['desk']))).toBe(false);
  });

  it('keeps one with no personas, which follows its parent', () => {
    expect(isChildOffPersona([], new Set(['desk']))).toBe(false);
  });

  it('fades nothing while no persona is picked', () => {
    expect(isChildOffPersona(['rider'], new Set())).toBe(false);
  });
});

describe('picking teams and personas together', () => {
  it('shows only tasks that match both', () => {
    const teams = new Set(['bench']);
    const personas = new Set(['rider']);
    expect(isOffPick(task('a', ['rider'], 'bench'), teams, personas)).toBe(false);
    expect(isOffPick(task('c', ['rider'], 'till'), teams, personas)).toBe(true);
    expect(isOffPick(task('e', ['desk'], 'bench'), teams, personas)).toBe(true);
  });

  it('works with No team', () => {
    expect(isOffPick(task('b', ['desk']), new Set([NO_TEAM]), new Set(['desk']))).toBe(false);
  });
});

describe('chaptersWithPicks', () => {
  it('keeps chapters holding any task of a picked persona, in story order', () => {
    expect(chaptersWithPicks(activities, new Set(), new Set(['desk']))).toEqual(['act_1', 'act_2']);
  });

  it('keeps only chapters with a task matching every pick', () => {
    expect(chaptersWithPicks(activities, new Set(['till']), new Set(['rider']))).toEqual(['act_2']);
  });

  it('keeps none when nothing matches', () => {
    expect(chaptersWithPicks(activities, new Set(['bench']), new Set(['desk']))).toEqual([]);
  });
});

describe('personaTaskCount', () => {
  it('counts the tasks whose roll-up includes the persona', () => {
    expect(personaTaskCount(activities, 'desk')).toBe(2);
    expect(personaTaskCount(activities, 'owner')).toBe(0);
  });
});

describe('personaForNewTask', () => {
  it('gives a new task the persona when exactly one is picked', () => {
    expect(personaForNewTask(new Set(['desk']))).toBe('desk');
  });

  it('gives it none otherwise', () => {
    expect(personaForNewTask(new Set())).toBeNull();
    expect(personaForNewTask(new Set(['desk', 'rider']))).toBeNull();
  });
});

describe('personaChipLabel', () => {
  it('says only for a single persona', () => {
    expect(personaChipLabel(['Front desk'], 5)).toBe('Front desk only');
  });

  it('names two without only', () => {
    expect(personaChipLabel(['Rider', 'Front desk'], 5)).toBe('Rider and Front desk');
  });

  it('counts three or more', () => {
    expect(personaChipLabel(['Rider', 'Front desk', 'Owner'], 5)).toBe('3 personas');
  });

  it('says all personas when every persona is picked', () => {
    expect(personaChipLabel(['Rider', 'Owner'], 2)).toBe('All personas');
  });
});

describe('personaSummary', () => {
  const noTeams = { phrase: '', onlyNoTeam: false };

  it('names the picked personas', () => {
    expect(personaSummary(noTeams, ['Front desk'], true)).toBe('Chapters without Front desk’s tasks are folded away.');
  });

  it('says when a persona has no tasks', () => {
    expect(personaSummary(noTeams, ['Owner'], false)).toBe('No tasks for Owner yet.');
  });

  it('names teams and personas together', () => {
    const bench = { phrase: 'Bench', onlyNoTeam: false };
    expect(personaSummary(bench, ['Mechanic'], true)).toBe(
      'Chapters without Bench’s tasks for Mechanic are folded away.',
    );
    expect(personaSummary(bench, ['Mechanic'], false)).toBe('No tasks for Bench and Mechanic yet.');
  });

  it('reads with No team picked', () => {
    expect(personaSummary({ phrase: 'No team', onlyNoTeam: true }, ['Rider'], true)).toBe(
      'Chapters with no unowned tasks for Rider are folded away.',
    );
  });
});
