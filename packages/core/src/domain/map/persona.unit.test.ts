import { describe, expect, it } from 'vitest';
import type { MapId, PersonaId, StepId, StoryMap, TaskId, TeamId } from './story-map.ts';
import { setPersona } from './persona.ts';
import { moveTaskInMap } from './move.ts';
import { assignTeam, removeTeam } from './team.ts';
import { addTask } from './add.ts';

const RIDER = 'ps_rider' as PersonaId;
const DESK = 'ps_desk' as PersonaId;
const BENCH = 'tm_bench' as TeamId;

const map: StoryMap = {
  id: 'map_1' as MapId,
  name: 'A small map',
  teams: [{ id: BENCH, name: 'Bench' }],
  personas: [
    { id: RIDER, name: 'Rider', icon: 'person' },
    { id: DESK, name: 'Front desk', icon: 'bell' },
  ],
  activities: [
    {
      id: 'act_1',
      name: 'First',
      tasks: [
        {
          id: 'tsk_1' as TaskId,
          name: 'Parent',
          teamId: BENCH,
          personaIds: [RIDER],
          subtasks: [
            {
              id: 'sub_1' as TaskId,
              name: 'Child',
              personaIds: [DESK],
              steps: [{ id: 'stp_1' as StepId, name: 'Step', note: '' }],
            },
            { id: 'sub_2' as TaskId, name: 'Bare', personaIds: [DESK], steps: [] },
          ],
        },
        { id: 'tsk_2' as TaskId, name: 'Loose', subtasks: [] },
      ],
    },
  ],
};

const tasks = (m: StoryMap) => m.activities.flatMap((activity) => activity.tasks);
const task = (m: StoryMap, id: string) => tasks(m).find((other) => other.id === id);
const subtask = (m: StoryMap, id: string) =>
  tasks(m)
    .flatMap((other) => other.subtasks)
    .find((sub) => sub.id === id);
const step = (m: StoryMap, id: string) =>
  tasks(m)
    .flatMap((other) => other.subtasks.flatMap((sub) => sub.steps))
    .find((other) => other.id === id);

describe('setPersona', () => {
  it('sets a persona on a task', () => {
    expect(task(setPersona(map, 'tsk_2', RIDER, true), 'tsk_2')?.personaIds).toEqual([RIDER]);
  });

  it('sets a persona on a subtask', () => {
    expect(subtask(setPersona(map, 'sub_1', RIDER, true), 'sub_1')?.personaIds).toEqual([DESK, RIDER]);
  });

  it('sets a persona on a step', () => {
    expect(step(setPersona(map, 'stp_1', DESK, true), 'stp_1')?.personaIds).toEqual([DESK]);
  });

  it('clears a persona, and leaves the others', () => {
    const twice = setPersona(map, 'tsk_1', DESK, true);
    expect(task(setPersona(twice, 'tsk_1', RIDER, false), 'tsk_1')?.personaIds).toEqual([DESK]);
  });

  it('never sets the same persona twice', () => {
    expect(task(setPersona(map, 'tsk_1', RIDER, true), 'tsk_1')?.personaIds).toEqual([RIDER]);
  });

  it('refuses a persona that isn’t on the map', () => {
    expect(() => setPersona(map, 'tsk_2', 'ps_none' as PersonaId, true)).toThrow(
      expect.objectContaining({ code: 'PERSONA_NOT_FOUND' }),
    );
  });

  it('refuses an item that isn’t on the map', () => {
    expect(() => setPersona(map, 'tsk_none', RIDER, true)).toThrow(expect.objectContaining({ code: 'ITEM_NOT_FOUND' }));
  });

  it('refuses a chapter, which takes no personas', () => {
    expect(() => setPersona(map, 'act_1', RIDER, true)).toThrow(expect.objectContaining({ code: 'ITEM_NOT_FOUND' }));
  });
});

describe('moving a task keeps its own personas', () => {
  it('when a subtask becomes a task', () => {
    const { map: moved } = moveTaskInMap(map, 'sub_2' as TaskId, { chapterId: 'act_1', before: null });
    expect(task(moved, 'sub_2')?.personaIds).toEqual([DESK]);
  });

  it('when a task becomes a subtask', () => {
    const { map: moved } = moveTaskInMap(setPersona(map, 'tsk_2', RIDER, true), 'tsk_2' as TaskId, {
      parentId: 'tsk_1' as TaskId,
      before: null,
    });
    expect(subtask(moved, 'tsk_2')?.personaIds).toEqual([RIDER]);
  });

  it('when a task moves along its chapter', () => {
    const { map: moved } = moveTaskInMap(map, 'tsk_1' as TaskId, { chapterId: 'act_1', before: null });
    expect(task(moved, 'tsk_1')?.personaIds).toEqual([RIDER]);
  });
});

describe('teams leave personas alone', () => {
  it('when a task’s team is taken away', () => {
    expect(task(assignTeam(map, 'tsk_1' as TaskId, null), 'tsk_1')?.personaIds).toEqual([RIDER]);
  });

  it('when its team is removed from the map', () => {
    expect(task(removeTeam(map, BENCH), 'tsk_1')?.personaIds).toEqual([RIDER]);
  });
});

describe('adding a task for a persona', () => {
  it('gives the new task the persona', () => {
    const added = addTask(map, {
      id: 'tsk_new' as TaskId,
      name: 'New',
      to: { chapterId: 'act_1' },
      personaIds: [DESK],
    });
    expect(task(added, 'tsk_new')?.personaIds).toEqual([DESK]);
  });

  it('gives it a team as well when one is picked', () => {
    const added = addTask(map, {
      id: 'tsk_new' as TaskId,
      name: 'New',
      to: { chapterId: 'act_1' },
      teamId: BENCH,
      personaIds: [DESK],
    });
    expect(task(added, 'tsk_new')).toMatchObject({ teamId: BENCH, personaIds: [DESK] });
  });

  it('refuses a persona that isn’t on the map', () => {
    expect(() =>
      addTask(map, {
        id: 'tsk_new' as TaskId,
        name: 'New',
        to: { chapterId: 'act_1' },
        personaIds: ['ps_none' as PersonaId],
      }),
    ).toThrow(expect.objectContaining({ code: 'PERSONA_NOT_FOUND' }));
  });
});
