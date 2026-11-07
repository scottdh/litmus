import { describe, expect, it } from 'vitest';
import { DomainError } from '../../kernel/errors.ts';
import { addStep, moveStep, renameStep, setStepNote } from './step.ts';
import type { MapId, StepId, StoryMap, TaskId } from './story-map.ts';

const id = (value: string) => value as TaskId;
const stepId = (value: string) => value as StepId;

const map: StoryMap = {
  id: 'map_1' as MapId,
  name: 'A small map',
  teams: [],
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

describe('moveStep', () => {
  const step = (value: string) => ({ id: stepId(value), name: value.toUpperCase(), note: `About ${value}` });
  const two: StoryMap = {
    ...map,
    activities: [
      {
        id: 'act_1',
        name: 'First',
        tasks: [
          { id: id('tsk_alone'), name: 'Alone', subtasks: [] },
          {
            id: id('tsk_parent'),
            name: 'With children',
            subtasks: [
              { id: id('sub_1'), name: 'One', steps: [step('s1'), step('s2'), step('s3')] },
              { id: id('sub_2'), name: 'Two', steps: [step('t1')] },
              { id: id('sub_3'), name: 'Three', steps: [] },
            ],
          },
        ],
      },
    ],
  };
  const namesIn = (next: StoryMap, sub: number) =>
    next.activities[0]?.tasks[1]?.subtasks[sub]?.steps.map((item) => item.name);

  it('reorders a step among its siblings', () => {
    expect(namesIn(moveStep(two, stepId('s3'), { subtaskId: id('sub_1'), before: stepId('s1') }), 0)).toEqual([
      'S3',
      'S1',
      'S2',
    ]);
  });

  it('moves a step to the end of its subtask', () => {
    expect(namesIn(moveStep(two, stepId('s1'), { subtaskId: id('sub_1'), before: null }), 0)).toEqual([
      'S2',
      'S3',
      'S1',
    ]);
  });

  it('moves a step to another subtask, keeping its note', () => {
    const moved = moveStep(two, stepId('s2'), { subtaskId: id('sub_2'), before: stepId('t1') });
    expect(namesIn(moved, 0)).toEqual(['S1', 'S3']);
    expect(moved.activities[0]?.tasks[1]?.subtasks[1]?.steps).toEqual([step('s2'), step('t1')]);
  });

  it('gives a subtask its first step', () => {
    expect(namesIn(moveStep(two, stepId('t1'), { subtaskId: id('sub_3'), before: null }), 2)).toEqual(['T1']);
  });

  it('leaves the original untouched', () => {
    moveStep(two, stepId('s1'), { subtaskId: id('sub_1'), before: null });
    expect(namesIn(two, 0)).toEqual(['S1', 'S2', 'S3']);
  });

  it('won’t put a step under a task, because only subtasks hold steps', () => {
    expect(codeOf(() => moveStep(two, stepId('s1'), { subtaskId: id('tsk_alone'), before: null }))).toBe(
      'STEPS_NEED_A_SUBTASK',
    );
  });

  it('refuses a step that does not exist', () => {
    expect(codeOf(() => moveStep(two, stepId('nope'), { subtaskId: id('sub_1'), before: null }))).toBe(
      'STEP_NOT_FOUND',
    );
  });

  it('refuses a subtask that does not exist', () => {
    expect(codeOf(() => moveStep(two, stepId('s1'), { subtaskId: id('nope'), before: null }))).toBe(
      'DESTINATION_NOT_FOUND',
    );
  });

  it('refuses a place that is not in that subtask', () => {
    expect(codeOf(() => moveStep(two, stepId('s1'), { subtaskId: id('sub_2'), before: stepId('s2') }))).toBe(
      'DESTINATION_NOT_FOUND',
    );
  });
});
