import { describe, expect, it } from 'vitest';
import { DomainError } from '../../kernel/errors.ts';
import { renameActivity, renameTask } from './rename.ts';
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

describe('renameTask', () => {
  it('renames a task', () => {
    expect(renameTask(map, id('tsk_leaf'), 'Renamed').activities[0]?.tasks[0]?.name).toBe('Renamed');
  });

  it('renames a subtask', () => {
    expect(renameTask(map, id('tsk_child'), 'Renamed').activities[0]?.tasks[1]?.subtasks[0]?.name).toBe('Renamed');
  });

  it('leaves everything else alone, and the original untouched', () => {
    const renamed = renameTask(map, id('tsk_leaf'), 'Renamed');
    expect(renamed.activities[0]?.tasks[1]?.name).toBe('With children');
    expect(map.activities[0]?.tasks[0]?.name).toBe('On its own');
  });

  it('tidies whitespace, including line breaks from pasting', () => {
    expect(renameTask(map, id('tsk_leaf'), '  Two\n  lines ').activities[0]?.tasks[0]?.name).toBe('Two lines');
  });

  it('rejects an empty name', () => {
    expect(codeOf(() => renameTask(map, id('tsk_leaf'), ' \n '))).toBe('NAME_EMPTY');
  });

  it('rejects a task that does not exist', () => {
    expect(codeOf(() => renameTask(map, id('tsk_missing'), 'Renamed'))).toBe('TASK_NOT_FOUND');
  });
});

describe('renameActivity', () => {
  it('renames a chapter', () => {
    expect(renameActivity(map, 'act_2', 'Renamed').activities[1]?.name).toBe('Renamed');
  });

  it('rejects an empty name', () => {
    expect(codeOf(() => renameActivity(map, 'act_2', ''))).toBe('NAME_EMPTY');
  });

  it('rejects a chapter that does not exist', () => {
    expect(codeOf(() => renameActivity(map, 'act_missing', 'Renamed'))).toBe('ACTIVITY_NOT_FOUND');
  });

  it('fails with the closed error type', () => {
    let caught: unknown;
    try {
      renameActivity(map, 'act_2', '');
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).kind).toBe('ValidationError');
  });
});
