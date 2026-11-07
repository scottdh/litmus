import { describe, expect, it } from 'vitest';
import {
  PERSONA_ICONS,
  type MapId,
  type PersonaIcon,
  type PersonaId,
  type StepId,
  type StoryMap,
  type TaskId,
  type TeamId,
} from './story-map.ts';
import { addPersona, removePersona, renamePersona, setPersona, setPersonaIcon } from './persona.ts';
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

describe('addPersona', () => {
  it('adds a persona at the end, with the next unused icon', () => {
    const added = addPersona(map, { id: 'ps_new' as PersonaId, name: '  Owner ' });
    expect(added.personas.at(-1)).toEqual({ id: 'ps_new', name: 'Owner', icon: 'wrench' });
  });

  it('skips icons already worn, wherever they sit in the set', () => {
    const worn = { ...map, personas: [{ id: RIDER, name: 'Rider', icon: 'wrench' as const }] };
    expect(addPersona(worn, { id: 'ps_new' as PersonaId, name: 'New' }).personas.at(-1)?.icon).toBe('person');
  });

  it('starts the set again once every icon is worn', () => {
    const full = {
      ...map,
      personas: PERSONA_ICONS.map((icon, index) => ({ id: `ps_${String(index)}` as PersonaId, name: icon, icon })),
    };
    expect(addPersona(full, { id: 'ps_new' as PersonaId, name: 'New' }).personas.at(-1)?.icon).toBe('person');
  });

  it('refuses an empty name', () => {
    expect(() => addPersona(map, { id: 'ps_new' as PersonaId, name: '  ' })).toThrow(
      expect.objectContaining({ code: 'NAME_EMPTY' }),
    );
  });
});

describe('renamePersona', () => {
  it('tidies and keeps the new name', () => {
    expect(renamePersona(map, DESK, ' Front   counter ').personas[1]?.name).toBe('Front counter');
  });

  it('refuses an empty name', () => {
    expect(() => renamePersona(map, DESK, '')).toThrow(expect.objectContaining({ code: 'NAME_EMPTY' }));
  });

  it('refuses a persona that isn’t on the map', () => {
    expect(() => renamePersona(map, 'ps_none' as PersonaId, 'X')).toThrow(
      expect.objectContaining({ code: 'PERSONA_NOT_FOUND' }),
    );
  });
});

describe('setPersonaIcon', () => {
  it('changes a persona’s icon', () => {
    expect(setPersonaIcon(map, DESK, 'phone').personas[1]?.icon).toBe('phone');
  });

  it('refuses an icon outside the set', () => {
    expect(() => setPersonaIcon(map, DESK, 'rocket' as PersonaIcon)).toThrow(
      expect.objectContaining({ code: 'ICON_NOT_FOUND' }),
    );
  });

  it('refuses a persona that isn’t on the map', () => {
    expect(() => setPersonaIcon(map, 'ps_none' as PersonaId, 'star')).toThrow(
      expect.objectContaining({ code: 'PERSONA_NOT_FOUND' }),
    );
  });
});

describe('removePersona', () => {
  const everywhere = setPersona(setPersona(map, 'stp_1', DESK, true), 'stp_1', RIDER, true);

  it('takes it off the map, keeping the others in order', () => {
    expect(removePersona(map, RIDER).personas).toEqual([{ id: DESK, name: 'Front desk', icon: 'bell' }]);
  });

  it('takes it off every task, subtask and step it was on, and leaves the rest', () => {
    const removed = removePersona(everywhere, DESK);
    expect(task(removed, 'tsk_1')?.personaIds).toEqual([RIDER]);
    expect(subtask(removed, 'sub_1')?.personaIds).toEqual([]);
    expect(subtask(removed, 'sub_2')?.personaIds).toEqual([]);
    expect(step(removed, 'stp_1')?.personaIds).toEqual([RIDER]);
  });

  it('leaves items that never had personas as they were', () => {
    expect(task(removePersona(map, RIDER), 'tsk_2')).toEqual(task(map, 'tsk_2'));
  });

  it('refuses a persona that isn’t on the map', () => {
    expect(() => removePersona(map, 'ps_none' as PersonaId)).toThrow(
      expect.objectContaining({ code: 'PERSONA_NOT_FOUND' }),
    );
  });
});
