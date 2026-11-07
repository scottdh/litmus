import { describe, expect, it } from 'vitest';
import { DomainError } from '../../kernel/errors.ts';
import { addActivity, addTask } from './add.ts';
import type { MapId, StoryMap, TaskId } from './story-map.ts';

const id = (value: string) => value as TaskId;

const map: StoryMap = {
  id: 'map_1' as MapId,
  name: 'A small map',
  teams: [],
  personas: [],
  activities: [
    {
      id: 'act_1',
      name: 'First',
      tasks: [
        { id: id('tsk_leaf'), name: 'On its own', subtasks: [] },
        {
          id: id('tsk_parent'),
          name: 'With children',
          subtasks: [{ id: id('tsk_child'), name: 'A child', steps: [] }],
        },
      ],
    },
    { id: 'act_2', name: 'Second', tasks: [] },
  ],
};

const codeOf = (attempt: () => unknown) => {
  try {
    attempt();
  } catch (caught) {
    return (caught as DomainError).code;
  }
  return null;
};

describe('addTask', () => {
  it('adds a task to the end of a chapter', () => {
    const added = addTask(map, { id: id('tsk_new'), name: 'New', to: { chapterId: 'act_1' } });
    expect(added.activities[0]?.tasks.map((task) => task.id)).toEqual(['tsk_leaf', 'tsk_parent', 'tsk_new']);
  });

  it('adds the first task to an empty chapter, with no subtasks', () => {
    const added = addTask(map, { id: id('tsk_new'), name: 'New', to: { chapterId: 'act_2' } });
    expect(added.activities[1]?.tasks).toEqual([{ id: 'tsk_new', name: 'New', subtasks: [] }]);
  });

  it('adds a subtask to the end of a task', () => {
    const added = addTask(map, { id: id('tsk_new'), name: 'New', to: { parentId: id('tsk_parent') } });
    expect(added.activities[0]?.tasks[1]?.subtasks.map((sub) => sub.id)).toEqual(['tsk_child', 'tsk_new']);
  });

  it('adds the first subtask to a plain task', () => {
    const added = addTask(map, { id: id('tsk_new'), name: 'New', to: { parentId: id('tsk_leaf') } });
    expect(added.activities[0]?.tasks[0]?.subtasks).toEqual([{ id: 'tsk_new', name: 'New', steps: [] }]);
  });

  it('tidies the name', () => {
    const added = addTask(map, { id: id('tsk_new'), name: '  Two\nlines ', to: { chapterId: 'act_2' } });
    expect(added.activities[1]?.tasks[0]?.name).toBe('Two lines');
  });

  it('refuses an empty name', () => {
    expect(codeOf(() => addTask(map, { id: id('tsk_new'), name: '  ', to: { chapterId: 'act_1' } }))).toBe(
      'NAME_EMPTY',
    );
  });

  it('refuses a third level', () => {
    expect(codeOf(() => addTask(map, { id: id('tsk_new'), name: 'New', to: { parentId: id('tsk_child') } }))).toBe(
      'WOULD_NEST_TOO_DEEP',
    );
  });

  it('refuses a chapter or parent that does not exist', () => {
    expect(codeOf(() => addTask(map, { id: id('tsk_new'), name: 'New', to: { chapterId: 'nope' } }))).toBe(
      'ACTIVITY_NOT_FOUND',
    );
    expect(codeOf(() => addTask(map, { id: id('tsk_new'), name: 'New', to: { parentId: id('nope') } }))).toBe(
      'TASK_NOT_FOUND',
    );
  });
});

describe('addActivity', () => {
  const order = (next: StoryMap) => next.activities.map((activity) => activity.id);

  it('adds a chapter to the end of the story', () => {
    const added = addActivity(map, { id: 'act_new', name: 'New', before: null });
    expect(order(added)).toEqual(['act_1', 'act_2', 'act_new']);
    expect(added.activities[2]).toEqual({ id: 'act_new', name: 'New', tasks: [] });
  });

  it('adds a chapter in front of another, keeping the story in order', () => {
    expect(order(addActivity(map, { id: 'act_new', name: 'New', before: 'act_1' }))).toEqual([
      'act_new',
      'act_1',
      'act_2',
    ]);
    expect(order(addActivity(map, { id: 'act_new', name: 'New', before: 'act_2' }))).toEqual([
      'act_1',
      'act_new',
      'act_2',
    ]);
  });

  it('refuses an empty name', () => {
    expect(codeOf(() => addActivity(map, { id: 'act_new', name: ' ', before: null }))).toBe('NAME_EMPTY');
  });

  it('refuses to go in front of a chapter that does not exist', () => {
    expect(codeOf(() => addActivity(map, { id: 'act_new', name: 'New', before: 'nope' }))).toBe(
      'DESTINATION_NOT_FOUND',
    );
  });
});
