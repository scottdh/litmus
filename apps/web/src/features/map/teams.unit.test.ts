import type { ActivityView, TaskView } from '@litmus/core';
import { describe, expect, it } from 'vitest';
import {
  NO_TEAM,
  chaptersWithTeams,
  isChildOffTeam,
  isOffTeam,
  teamTaskCount,
  teamChipLabel,
  teamForNewTask,
  teamSummary,
  picksStillOnMap,
  removeTeamWarning,
} from './teams';

const task = (id: string, teamId: string | null): TaskView => ({
  id,
  name: id,
  teamId,
  ownPersonaIds: [],
  personaIds: [],
  light: 'grey',
  review: null,
  earlierReview: null,
  subtasks: [],
  mix: [],
});

const withSubtasks = (parent: TaskView, subTeamIds: (string | null)[]): TaskView => ({
  ...parent,
  subtasks: subTeamIds.map((own, index) => ({
    id: `${parent.id}_${String(index)}`,
    name: 'Sub',
    light: 'grey',
    review: null,
    teamId: own ?? parent.teamId,
    ownTeamId: own,
    ownPersonaIds: [],
    personaIds: [],
    steps: [],
  })),
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

describe('a subtask with a team of its own', () => {
  const shared = withSubtasks(task('e', 'bench'), [null, 'till']);

  it('shows its task when its team is picked', () => {
    expect(isOffTeam(shared, new Set(['till']))).toBe(false);
    expect(isOffTeam(shared, new Set(['bench']))).toBe(false);
    expect(isOffTeam(shared, new Set(['reach']))).toBe(true);
  });

  it('fades inside a task on show when its team isn’t picked', () => {
    const [following, own] = shared.subtasks;
    if (!following || !own) throw new Error('missing subtasks');
    expect(isChildOffTeam(own, new Set())).toBe(false);
    expect(isChildOffTeam(own, new Set(['bench']))).toBe(true);
    expect(isChildOffTeam(following, new Set(['bench']))).toBe(false);
    expect(isChildOffTeam(following, new Set(['till']))).toBe(true);
  });

  it('counts its task for its team, once however many subtasks it has there', () => {
    const tasks = [chapter('act_1', [shared, withSubtasks(task('f', null), ['till', 'till'])])];
    expect(teamTaskCount(tasks, 'till')).toBe(2);
    expect(teamTaskCount(tasks, 'bench')).toBe(1);
    expect(teamTaskCount(tasks, NO_TEAM)).toBe(1);
  });

  it('keeps its chapter open', () => {
    expect(chaptersWithTeams([chapter('act_9', [shared])], new Set(['till']))).toEqual(['act_9']);
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

describe('teamChipLabel', () => {
  it('says only for a single team', () => {
    expect(teamChipLabel(['Till'], 4)).toBe('Till only');
  });

  it('names two teams without only', () => {
    expect(teamChipLabel(['Till', 'Reach'], 4)).toBe('Till and Reach');
  });

  it('counts three or more', () => {
    expect(teamChipLabel(['Bench', 'Till', 'Reach'], 4)).toBe('3 teams');
  });

  it('says all teams when every team is picked', () => {
    expect(teamChipLabel(['Counter', 'Bench', 'Till', 'Reach'], 4)).toBe('All teams');
    expect(teamChipLabel(['Till', 'Reach'], 2)).toBe('All teams');
  });

  it('keeps only for the one team on a map with one team', () => {
    expect(teamChipLabel(['Till'], 1)).toBe('Till only');
  });
});

describe('picking No team', () => {
  it('keeps tasks with no team at full strength, and fades the rest', () => {
    const picked = new Set([NO_TEAM]);
    expect(isOffTeam(task('b', null), picked)).toBe(false);
    expect(isOffTeam(task('a', 'bench'), picked)).toBe(true);
  });

  it('works alongside a team', () => {
    const picked = new Set(['bench', NO_TEAM]);
    expect(isOffTeam(task('a', 'bench'), picked)).toBe(false);
    expect(isOffTeam(task('b', null), picked)).toBe(false);
    expect(isOffTeam(task('c', 'till'), picked)).toBe(true);
  });

  it('folds chapters that have no unowned tasks', () => {
    expect(chaptersWithTeams(activities, new Set([NO_TEAM]))).toEqual(['act_1', 'act_3']);
  });

  it('gives a new task no team when it is the only pick', () => {
    expect(teamForNewTask(new Set([NO_TEAM]))).toBeNull();
  });
});

describe('teamSummary', () => {
  const picks = (names: string[], noTeam = false, allTeams = false) => ({ names, noTeam, allTeams });

  it('names the teams whose tasks are kept', () => {
    expect(teamSummary(picks(['Bench', 'Till']), true)).toBe(
      'Chapters without Bench and Till’s tasks are folded away.',
    );
  });

  it('calls tasks with no team unowned', () => {
    expect(teamSummary(picks([], true), true)).toBe('Chapters without unowned tasks are folded away.');
    expect(teamSummary(picks(['Till'], true), true)).toBe(
      'Chapters without Till’s tasks or unowned ones are folded away.',
    );
  });

  it('says any team when every team is picked', () => {
    expect(teamSummary(picks(['Bench', 'Till'], false, true), true)).toBe(
      'Chapters without any team’s tasks are folded away.',
    );
  });

  it('says when nothing matches', () => {
    expect(teamSummary(picks(['Till']), false)).toBe('Till has no tasks yet.');
    expect(teamSummary(picks(['Bench', 'Till']), false)).toBe('Bench and Till have no tasks yet.');
    expect(teamSummary(picks([], true), false)).toBe('Every task has a team.');
    expect(teamSummary(picks(['Till'], true), false)).toBe('Till has no tasks yet, and every task has a team.');
    expect(teamSummary(picks(['Bench', 'Till'], false, true), false)).toBe('No team has tasks yet.');
  });
});

describe('picksStillOnMap', () => {
  it('drops a team that has been removed', () => {
    expect([...picksStillOnMap(new Set(['bench', 'till', NO_TEAM]), ['bench'])]).toEqual(['bench', NO_TEAM]);
  });

  it('drops No team once the map has no teams, because every task is unowned', () => {
    expect([...picksStillOnMap(new Set([NO_TEAM]), [])]).toEqual([]);
  });
});

describe('removeTeamWarning', () => {
  it('says how many tasks lose their team', () => {
    expect(removeTeamWarning(18)).toBe('Its 18 tasks stay on the map and lose their team. You can undo this.');
  });

  it('says one task, not one tasks', () => {
    expect(removeTeamWarning(1)).toBe('Its 1 task stays on the map and loses its team. You can undo this.');
  });

  it('says so when the team has no tasks', () => {
    expect(removeTeamWarning(0)).toBe('It has no tasks. You can undo this.');
  });
});
