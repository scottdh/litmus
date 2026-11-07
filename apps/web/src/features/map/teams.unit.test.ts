import type { ActivityView, TaskView } from '@litmus/core';
import { describe, expect, it } from 'vitest';
import { chaptersWithTeams, isOffTeam, teamForNewTask } from './teams';

const task = (id: string, teamId: string | null): TaskView => ({
  id,
  name: id,
  teamId,
  light: 'grey',
  review: null,
  earlierReview: null,
  subtasks: [],
  mix: [],
});

const chapter = (id: string, tasks: TaskView[]): ActivityView => ({ id, name: id, tasks, mix: [] });

const activities = [
  chapter('act_1', [task('a', 'bench'), task('b', null)]),
  chapter('act_2', [task('c', 'till')]),
  chapter('act_3', [task('d', null)]),
  chapter('act_4', []),
];

describe('isOffTeam', () => {
  it('fades nothing while no team is picked', () => {
    expect(isOffTeam(task('a', null), new Set())).toBe(false);
  });

  it('fades tasks of other teams, and tasks with no team', () => {
    const picked = new Set(['bench']);
    expect(isOffTeam(task('a', 'bench'), picked)).toBe(false);
    expect(isOffTeam(task('c', 'till'), picked)).toBe(true);
    expect(isOffTeam(task('b', null), picked)).toBe(true);
  });
});

describe('chaptersWithTeams', () => {
  it('keeps chapters holding any picked team’s task, in story order', () => {
    expect(chaptersWithTeams(activities, new Set(['till', 'bench']))).toEqual(['act_1', 'act_2']);
  });

  it('keeps none when the picked team has no tasks', () => {
    expect(chaptersWithTeams(activities, new Set(['reach']))).toEqual([]);
  });
});

describe('teamForNewTask', () => {
  it('gives a new task to the team when exactly one is picked', () => {
    expect(teamForNewTask(new Set(['bench']))).toBe('bench');
  });

  it('gives it no team otherwise', () => {
    expect(teamForNewTask(new Set())).toBeNull();
    expect(teamForNewTask(new Set(['bench', 'till']))).toBeNull();
  });
});
