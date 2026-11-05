import { describe, expect, it } from 'vitest';
import { DomainError } from '../../kernel/errors.ts';
import { addStep, renameStep, setStepNote } from './step.ts';
import type { MapId, StepId, StoryMap, TaskId } from './story-map.ts';

const id = (value: string) => value as TaskId;
const stepId = (value: string) => value as StepId;

const map: StoryMap = {
  id: 'map_1' as MapId,
  name: 'A small map',
  activities: [
    {
      id: 'act_1',
      name: 'First',
      tasks: [
        {
          id: id('tsk_parent'),
          name: 'With children',
          subtasks: [
            { id: id('tsk_child'), name: 'A child', steps: [{ id: stepId('stp_1'), name: 'One', note: 'Why' }] },
          ],
        },
      ],
    },
  ],
};

const steps = (next: StoryMap) => next.activities[0]?.tasks[0]?.subtasks[0]?.steps;

const codeOf = (attempt: () => unknown) => {
  try {
    attempt();
  } catch (caught) {
    return (caught as DomainError).code;
  }
  return null;
};

describe('addStep', () => {
  it('adds a step to the end of a subtask, with an empty note', () => {
    const added = addStep(map, { id: stepId('stp_2'), name: 'Two', subtaskId: id('tsk_child') });
    expect(steps(added)).toEqual([
      { id: 'stp_1', name: 'One', note: 'Why' },
      { id: 'stp_2', name: 'Two', note: '' },
    ]);
  });

  it('tidies the name, and leaves the original untouched', () => {
    const added = addStep(map, { id: stepId('stp_2'), name: '  Two\nlines ', subtaskId: id('tsk_child') });
    expect(steps(added)?.[1]?.name).toBe('Two lines');
    expect(steps(map)).toHaveLength(1);
  });

  it('refuses an empty name', () => {
    expect(codeOf(() => addStep(map, { id: stepId('stp_2'), name: ' ', subtaskId: id('tsk_child') }))).toBe(
      'NAME_EMPTY',
    );
  });

  it('refuses a task, because only subtasks hold steps', () => {
    expect(codeOf(() => addStep(map, { id: stepId('stp_2'), name: 'Two', subtaskId: id('tsk_parent') }))).toBe(
      'STEPS_NEED_A_SUBTASK',
    );
  });

  it('refuses a subtask that does not exist', () => {
    expect(codeOf(() => addStep(map, { id: stepId('stp_2'), name: 'Two', subtaskId: id('nope') }))).toBe(
      'TASK_NOT_FOUND',
    );
  });
});

describe('renameStep', () => {
  it('renames a step and keeps its note', () => {
    expect(steps(renameStep(map, stepId('stp_1'), ' Renamed '))).toEqual([
      { id: 'stp_1', name: 'Renamed', note: 'Why' },
    ]);
  });

  it('refuses an empty name', () => {
    expect(codeOf(() => renameStep(map, stepId('stp_1'), ' '))).toBe('NAME_EMPTY');
  });

  it('refuses a step that does not exist', () => {
    expect(codeOf(() => renameStep(map, stepId('nope'), 'Renamed'))).toBe('STEP_NOT_FOUND');
  });
});

describe('setStepNote', () => {
  it('keeps line breaks inside a note, and trims its ends', () => {
    expect(steps(setStepNote(map, stepId('stp_1'), '  First\n\nSecond \n'))?.[0]?.note).toBe('First\n\nSecond');
  });

  it('lets a note be emptied', () => {
    expect(steps(setStepNote(map, stepId('stp_1'), '  '))?.[0]?.note).toBe('');
  });

  it('refuses a step that does not exist', () => {
    expect(codeOf(() => setStepNote(map, stepId('nope'), 'Note'))).toBe('STEP_NOT_FOUND');
  });
});
