import type { MapView } from '@litmus/core';
import { describe, expect, it } from 'vitest';
import { findSubject } from './subject';

const map: MapView = {
  id: 'map_1',
  name: 'A small map',
  productName: 'Thing',
  teams: [
    { id: 'tm_bench', name: 'Bench' },
    { id: 'tm_till', name: 'Till' },
  ],
  personas: [
    { id: 'ps_rider', name: 'Rider', icon: 'person' },
    { id: 'ps_desk', name: 'Front desk', icon: 'bell' },
  ],
  activities: [
    { id: 'act_1', name: 'First', tasks: [], mix: [] },
    {
      id: 'act_2',
      name: 'Second',
      mix: [],
      tasks: [
        {
          id: 'tsk_leaf',
          name: 'On its own',
          teamId: 'tm_bench',
          ownPersonaIds: [],
          personaIds: [],
          light: 'red',
          review: 'Broken.',
          earlierReview: null,
          subtasks: [],
          mix: [],
        },
        {
          id: 'tsk_parent',
          name: 'With children',
          teamId: null,
          ownPersonaIds: ['ps_rider'],
          personaIds: ['ps_rider', 'ps_desk'],
          light: 'yellow',
          review: null,
          earlierReview: null,
          subtasks: [
            {
              id: 'tsk_child',
              name: 'A child',
              light: 'green',
              review: 'Fine.',
              teamId: null,
              ownTeamId: null,
              ownPersonaIds: [],
              personaIds: ['ps_desk'],
              steps: [{ id: 'stp_1', name: 'A step', note: 'A note', personaIds: ['ps_desk'] }],
            },
          ],
          mix: [],
        },
        {
          id: 'tsk_shared',
          name: 'Shared',
          teamId: 'tm_bench',
          ownPersonaIds: [],
          personaIds: [],
          light: 'grey',
          review: null,
          earlierReview: null,
          subtasks: [
            {
              id: 'tsk_bench_part',
              name: 'Bench part',
              light: 'grey',
              review: null,
              teamId: 'tm_bench',
              ownTeamId: null,
              ownPersonaIds: [],
              personaIds: [],
              steps: [],
            },
            {
              id: 'tsk_till_part',
              name: 'Till part',
              light: 'red',
              review: null,
              teamId: 'tm_till',
              ownTeamId: 'tm_till',
              ownPersonaIds: [],
              personaIds: [],
              steps: [],
            },
          ],
          mix: [],
        },
      ],
    },
  ],
};

describe('findSubject', () => {
  it('finds a team, with its tasks under their chapters', () => {
    expect(findSubject(map, 'tm_bench')).toEqual({
      kind: 'team',
      id: 'tm_bench',
      name: 'Bench',
      path: 'Team',
      chapters: [
        {
          id: 'act_2',
          name: 'Second',
          tasks: [
            { id: 'tsk_leaf', name: 'On its own', light: 'red' },
            { id: 'tsk_shared', name: 'Shared', light: 'grey' },
          ],
        },
      ],
    });
  });

  it('lists a subtask a team has under another team’s task, naming that task', () => {
    expect(findSubject(map, 'tm_till')).toMatchObject({
      kind: 'team',
      chapters: [{ id: 'act_2', tasks: [{ id: 'tsk_till_part', name: 'Till part', light: 'red', under: 'Shared' }] }],
    });
  });

  it('finds a team with no tasks yet', () => {
    const empty = { ...map, teams: [...map.teams, { id: 'tm_reach', name: 'Reach' }] };
    expect(findSubject(empty, 'tm_reach')).toMatchObject({ kind: 'team', chapters: [] });
  });

  it('finds a chapter, with its place in the story', () => {
    expect(findSubject(map, 'act_2')).toEqual({
      kind: 'chapter',
      id: 'act_2',
      name: 'Second',
      chapterId: 'act_2',
      path: 'Chapter 2',
    });
  });

  it('finds a task', () => {
    expect(findSubject(map, 'tsk_leaf')).toEqual({
      kind: 'task',
      id: 'tsk_leaf',
      name: 'On its own',
      chapterId: 'act_2',
      path: 'Chapter 2 · Second',
      teamId: 'tm_bench',
      ownTeamId: 'tm_bench',
      taskTeamId: null,
      ownPersonaIds: [],
      personaIds: [],
      light: 'red',
      review: 'Broken.',
      earlierReview: null,
      subtasks: [],
      steps: [],
    });
  });

  it('lists the subtasks a task’s light follows from, with their personas', () => {
    expect(findSubject(map, 'tsk_parent')).toMatchObject({
      light: 'yellow',
      ownPersonaIds: ['ps_rider'],
      personaIds: ['ps_rider', 'ps_desk'],
      subtasks: [{ id: 'tsk_child', name: 'A child', light: 'green', personaIds: ['ps_desk'] }],
    });
  });

  it('finds a subtask, with its parent in the path', () => {
    expect(findSubject(map, 'tsk_child')).toEqual({
      kind: 'subtask',
      id: 'tsk_child',
      name: 'A child',
      chapterId: 'act_2',
      path: 'Chapter 2 · Second · With children',
      teamId: null,
      ownTeamId: null,
      taskTeamId: null,
      ownPersonaIds: [],
      personaIds: ['ps_desk'],
      light: 'green',
      review: 'Fine.',
      earlierReview: null,
      subtasks: [],
      steps: [{ id: 'stp_1', name: 'A step', note: 'A note', personaIds: ['ps_desk'] }],
    });
  });

  it('finds a subtask with a team of its own, and the team it would follow', () => {
    expect(findSubject(map, 'tsk_till_part')).toMatchObject({
      kind: 'subtask',
      teamId: 'tm_till',
      ownTeamId: 'tm_till',
      taskTeamId: 'tm_bench',
    });
  });

  it('finds a step, with its subtask in the path', () => {
    expect(findSubject(map, 'stp_1')).toEqual({
      kind: 'step',
      id: 'stp_1',
      name: 'A step',
      note: 'A note',
      personaIds: ['ps_desk'],
      chapterId: 'act_2',
      path: 'Chapter 2 · Second · With children · A child',
    });
  });

  it('finds nothing for an id that is not on the map', () => {
    expect(findSubject(map, 'tsk_missing')).toBeNull();
  });
});
