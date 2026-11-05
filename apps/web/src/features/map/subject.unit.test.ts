import type { MapView } from '@litmus/core';
import { describe, expect, it } from 'vitest';
import { findSubject } from './subject';

const map: MapView = {
  id: 'map_1',
  name: 'A small map',
  productName: 'Thing',
  activities: [
    { id: 'act_1', name: 'First', tasks: [], mix: [] },
    {
      id: 'act_2',
      name: 'Second',
      mix: [],
      tasks: [
        { id: 'tsk_leaf', name: 'On its own', light: 'red', review: 'Broken.', subtasks: [], mix: [] },
        {
          id: 'tsk_parent',
          name: 'With children',
          light: 'yellow',
          review: null,
          subtasks: [{ id: 'tsk_child', name: 'A child', light: 'green', review: 'Fine.' }],
          mix: [],
        },
      ],
    },
  ],
};

describe('findSubject', () => {
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
      light: 'red',
      review: 'Broken.',
      subtasks: [],
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
      light: 'green',
      review: 'Fine.',
      subtasks: [],
    });
  });

  it('finds nothing for an id that is not on the map', () => {
    expect(findSubject(map, 'tsk_missing')).toBeNull();
  });
});
