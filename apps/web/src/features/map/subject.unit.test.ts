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
  personas: [],
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
          ownPersonaIds: [],
          personaIds: [],
          light: 'yellow',
          review: null,
          earlierReview: null,
          subtasks: [
            {
              id: 'tsk_child',
              name: 'A child',
              light: 'green',
              review: 'Fine.',
              ownPersonaIds: [],
              personaIds: [],
              steps: [{ id: 'stp_1', name: 'A step', note: 'A note', personaIds: [] }],
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
      chapters: [{ id: 'act_2', name: 'Second', tasks: [{ id: 'tsk_leaf', name: 'On its own', light: 'red' }] }],
    });
  });

  it('finds a team with no tasks yet', () => {
    expect(findSubject(map, 'tm_till')).toMatchObject({ kind: 'team', chapters: [] });
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
      light: 'red',
      review: 'Broken.',
      earlierReview: null,
      subtasks: [],
      steps: [],
    });
  });

  it('lists the subtasks a task’s light follows from', () => {
    expect(findSubject(map, 'tsk_parent')).toMatchObject({
      light: 'yellow',
      subtasks: [{ id: 'tsk_child', name: 'A child', light: 'green' }],
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
      light: 'green',
      review: 'Fine.',
      earlierReview: null,
      subtasks: [],
      steps: [{ id: 'stp_1', name: 'A step', note: 'A note', personaIds: [] }],
    });
  });

  it('finds a step, with its subtask in the path', () => {
    expect(findSubject(map, 'stp_1')).toEqual({
      kind: 'step',
      id: 'stp_1',
      name: 'A step',
      note: 'A note',
      chapterId: 'act_2',
      path: 'Chapter 2 · Second · With children · A child',
    });
  });

  it('finds nothing for an id that is not on the map', () => {
    expect(findSubject(map, 'tsk_missing')).toBeNull();
  });
});
