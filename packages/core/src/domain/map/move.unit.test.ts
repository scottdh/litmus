import { describe, expect, it } from 'vitest';
import { DomainError } from '../../kernel/errors.ts';
import { moveTaskInMap } from './move.ts';
import type { MapId, Research, StepId, StoryMap, TaskId } from './story-map.ts';

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
        { id: id('a'), name: 'A', subtasks: [] },
        {
          id: id('b'),
          name: 'B',
          subtasks: [
            { id: id('b1'), name: 'B1', steps: [] },
            { id: id('b2'), name: 'B2', steps: [] },
          ],
        },
        { id: id('c'), name: 'C', subtasks: [] },
      ],
    },
    {
      id: 'act_2',
      name: 'Second',
      tasks: [
        { id: id('d'), name: 'D', subtasks: [] },
        { id: id('e'), name: 'E', subtasks: [{ id: id('e1'), name: 'E1', steps: [] }] },
      ],
    },
    { id: 'act_3', name: 'Empty', tasks: [] },
  ],
};

const names = (result: StoryMap, chapter: number) => result.activities[chapter]?.tasks.map((task) => task.name);
const subNames = (result: StoryMap, chapter: number, task: number) =>
  result.activities[chapter]?.tasks[task]?.subtasks.map((sub) => sub.name);

const codeOf = (attempt: () => unknown) => {
  try {
    attempt();
  } catch (caught) {
    return (caught as DomainError).code;
  }
  return null;
};

describe('moving within a chapter', () => {
  it('moves a task earlier', () => {
    const { map: moved } = moveTaskInMap(map, id('c'), { chapterId: 'act_1', before: id('a') });
    expect(names(moved, 0)).toEqual(['C', 'A', 'B']);
  });

  it('moves a task to the end', () => {
    const { map: moved } = moveTaskInMap(map, id('a'), { chapterId: 'act_1', before: null });
    expect(names(moved, 0)).toEqual(['B', 'C', 'A']);
  });

  it('leaves the original untouched', () => {
    moveTaskInMap(map, id('a'), { chapterId: 'act_1', before: null });
    expect(names(map, 0)).toEqual(['A', 'B', 'C']);
  });

  it('changes nothing when dropped back in the same place', () => {
    const { map: moved } = moveTaskInMap(map, id('a'), { chapterId: 'act_1', before: id('b') });
    expect(names(moved, 0)).toEqual(['A', 'B', 'C']);
  });
});

describe('moving between chapters', () => {
  it('takes a task’s subtasks with it', () => {
    const { map: moved } = moveTaskInMap(map, id('b'), { chapterId: 'act_2', before: id('e') });
    expect(names(moved, 0)).toEqual(['A', 'C']);
    expect(names(moved, 1)).toEqual(['D', 'B', 'E']);
    expect(subNames(moved, 1, 1)).toEqual(['B1', 'B2']);
  });

  it('moves into an empty chapter', () => {
    const { map: moved } = moveTaskInMap(map, id('a'), { chapterId: 'act_3', before: null });
    expect(names(moved, 2)).toEqual(['A']);
  });
});

describe('moving inside another task', () => {
  it('makes a task a subtask, which turns its new parent into a parent', () => {
    const { map: moved } = moveTaskInMap(map, id('a'), { parentId: id('c'), before: null });
    expect(names(moved, 0)).toEqual(['B', 'C']);
    expect(subNames(moved, 0, 1)).toEqual(['A']);
  });

  it('places it among existing subtasks', () => {
    const { map: moved } = moveTaskInMap(map, id('d'), { parentId: id('b'), before: id('b2') });
    expect(subNames(moved, 0, 1)).toEqual(['B1', 'D', 'B2']);
  });

  it('reorders subtasks', () => {
    const { map: moved } = moveTaskInMap(map, id('b2'), { parentId: id('b'), before: id('b1') });
    expect(subNames(moved, 0, 1)).toEqual(['B2', 'B1']);
  });

  it('moves a subtask to another parent', () => {
    const { map: moved } = moveTaskInMap(map, id('b1'), { parentId: id('e'), before: null });
    expect(subNames(moved, 0, 1)).toEqual(['B2']);
    expect(subNames(moved, 1, 1)).toEqual(['E1', 'B1']);
  });
});

describe('moving a subtask out', () => {
  it('makes it a task with no subtasks', () => {
    const { map: moved } = moveTaskInMap(map, id('b1'), { chapterId: 'act_1', before: id('c') });
    expect(names(moved, 0)).toEqual(['A', 'B', 'B1', 'C']);
    expect(moved.activities[0]?.tasks[2]?.subtasks).toEqual([]);
  });
});

describe('a parent losing its last child', () => {
  it('reports which parent was emptied', () => {
    const { emptiedParent, map: moved } = moveTaskInMap(map, id('e1'), { chapterId: 'act_2', before: null });
    expect(emptiedParent).toBe('e');
    expect(moved.activities[1]?.tasks[1]?.subtasks).toEqual([]);
  });

  it('reports nothing while children remain', () => {
    expect(moveTaskInMap(map, id('b1'), { chapterId: 'act_1', before: null }).emptiedParent).toBeNull();
  });

  it('reports nothing when the last child only moves within its parent', () => {
    expect(moveTaskInMap(map, id('e1'), { parentId: id('e'), before: null }).emptiedParent).toBeNull();
  });
});

describe('a subtask with steps', () => {
  const step = { id: 'stp_1' as StepId, name: 'A step', note: 'A note' };
  const withSteps: StoryMap = {
    ...map,
    activities: map.activities.map((activity) => ({
      ...activity,
      tasks: activity.tasks.map((task) => ({
        ...task,
        subtasks: task.subtasks.map((sub) => (sub.id === 'b1' ? { ...sub, steps: [step] } : sub)),
      })),
    })),
  };

  it('keeps them when reordered among its siblings', () => {
    const { map: moved } = moveTaskInMap(withSteps, id('b1'), { parentId: id('b'), before: null });
    expect(moved.activities[0]?.tasks[1]?.subtasks[1]).toEqual({ id: 'b1', name: 'B1', steps: [step] });
  });

  it('takes them to another parent', () => {
    const { map: moved } = moveTaskInMap(withSteps, id('b1'), { parentId: id('e'), before: null });
    expect(moved.activities[1]?.tasks[1]?.subtasks[1]?.steps).toEqual([step]);
  });

  it('can’t become a task, because only subtasks hold steps', () => {
    expect(codeOf(() => moveTaskInMap(withSteps, id('b1'), { chapterId: 'act_1', before: null }))).toBe(
      'STEPS_NEED_A_SUBTASK',
    );
  });
});

describe('moves that are refused', () => {
  it('won’t nest a task that has subtasks, which would make three levels', () => {
    expect(codeOf(() => moveTaskInMap(map, id('b'), { parentId: id('c'), before: null }))).toBe('WOULD_NEST_TOO_DEEP');
  });

  it('won’t nest under a subtask, which would make three levels', () => {
    expect(codeOf(() => moveTaskInMap(map, id('a'), { parentId: id('b1'), before: null }))).toBe('WOULD_NEST_TOO_DEEP');
  });

  it('won’t put a task inside itself', () => {
    expect(codeOf(() => moveTaskInMap(map, id('a'), { parentId: id('a'), before: null }))).toBe('MOVE_INTO_ITSELF');
  });

  it('rejects a task that does not exist', () => {
    expect(codeOf(() => moveTaskInMap(map, id('z'), { chapterId: 'act_1', before: null }))).toBe('TASK_NOT_FOUND');
  });

  it('rejects a chapter that does not exist', () => {
    expect(codeOf(() => moveTaskInMap(map, id('a'), { chapterId: 'act_9', before: null }))).toBe(
      'DESTINATION_NOT_FOUND',
    );
  });

  it('rejects a place that is not in that destination', () => {
    expect(codeOf(() => moveTaskInMap(map, id('a'), { chapterId: 'act_2', before: id('c') }))).toBe(
      'DESTINATION_NOT_FOUND',
    );
  });
});

describe('research', () => {
  const notes: Research = {
    summary: 'What we know.',
    hearing: [],
    pains: [{ text: 'A pain.', quotes: [] }],
    ideas: [],
  };
  const withResearch = (ids: string[]): StoryMap => ({
    ...map,
    activities: map.activities.map((activity) => ({
      ...activity,
      tasks: activity.tasks.map((task) => ({
        ...(ids.includes(task.id) ? { ...task, research: notes } : task),
        subtasks: task.subtasks.map((sub) => (ids.includes(sub.id) ? { ...sub, research: notes } : sub)),
      })),
    })),
  });

  it('goes with a task that becomes a subtask', () => {
    const { map: moved } = moveTaskInMap(withResearch(['a']), id('a'), { parentId: id('c'), before: null });
    expect(moved.activities[0]?.tasks[1]?.subtasks[0]?.research).toEqual(notes);
  });

  it('goes with a subtask that becomes a task', () => {
    const { map: moved } = moveTaskInMap(withResearch(['b1']), id('b1'), { chapterId: 'act_1', before: null });
    expect(moved.activities[0]?.tasks[3]?.research).toEqual(notes);
  });
});
