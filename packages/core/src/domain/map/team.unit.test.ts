import { describe, expect, it } from 'vitest';
import type { MapId, StoryMap, TaskId, TeamId } from './story-map.ts';
import { addTeam, assignTeam, removeTeam, renameTeam } from './team.ts';
import { moveTaskInMap } from './move.ts';
import { addTask } from './add.ts';

const BENCH = 'tm_bench' as TeamId;
const TILL = 'tm_till' as TeamId;

const map: StoryMap = {
  id: 'map_1' as MapId,
  name: 'A small map',
  teams: [
    { id: BENCH, name: 'Bench' },
    { id: TILL, name: 'Till' },
  ],
  personas: [],
  activities: [
    {
      id: 'act_1',
      name: 'First',
      tasks: [
        {
          id: 'tsk_1' as TaskId,
          name: 'Parent',
          teamId: BENCH,
          subtasks: [{ id: 'sub_1' as TaskId, name: 'Child', steps: [] }],
        },
        { id: 'tsk_2' as TaskId, name: 'Loose', subtasks: [] },
      ],
    },
  ],
};

const teamOf = (m: StoryMap, id: string) =>
  m.activities.flatMap((a) => a.tasks).find((task) => task.id === id)?.teamId ?? null;

/** The team set on the subtask itself, not the one it follows. */
const subTeamOf = (m: StoryMap, id: string) =>
  m.activities
    .flatMap((a) => a.tasks)
    .flatMap((task) => task.subtasks)
    .find((sub) => sub.id === id)?.teamId ?? null;

describe('assignTeam', () => {
  it('gives a task to a team', () => {
    expect(teamOf(assignTeam(map, 'tsk_2' as TaskId, BENCH), 'tsk_2')).toBe(BENCH);
  });

  it('takes a task away from its team', () => {
    expect(teamOf(assignTeam(map, 'tsk_1' as TaskId, null), 'tsk_1')).toBeNull();
  });

  it('refuses a team that isn’t on the map', () => {
    expect(() => assignTeam(map, 'tsk_2' as TaskId, 'tm_none' as TeamId)).toThrow(
      expect.objectContaining({ code: 'TEAM_NOT_FOUND' }),
    );
  });

  it('gives a subtask a team of its own, leaving its task’s team as it was', () => {
    const assigned = assignTeam(map, 'sub_1' as TaskId, TILL);
    expect(subTeamOf(assigned, 'sub_1')).toBe(TILL);
    expect(teamOf(assigned, 'tsk_1')).toBe(BENCH);
  });

  it('sets a subtask back to following its task with null', () => {
    const own = assignTeam(map, 'sub_1' as TaskId, TILL);
    const following = assignTeam(own, 'sub_1' as TaskId, null);
    expect(subTeamOf(following, 'sub_1')).toBeNull();
    expect('teamId' in (following.activities[0]?.tasks[0]?.subtasks[0] ?? {})).toBe(false);
  });

  it('refuses a task that isn’t on the map', () => {
    expect(() => assignTeam(map, 'tsk_none' as TaskId, BENCH)).toThrow(
      expect.objectContaining({ code: 'TASK_NOT_FOUND' }),
    );
  });

  it('keeps the team when a subtask following its task becomes a task', () => {
    const { map: moved } = moveTaskInMap(map, 'sub_1' as TaskId, { chapterId: 'act_1', before: null });
    expect(teamOf(moved, 'sub_1')).toBe(BENCH);
  });

  it('keeps its own team when a subtask with one becomes a task', () => {
    const own = assignTeam(map, 'sub_1' as TaskId, TILL);
    const { map: moved } = moveTaskInMap(own, 'sub_1' as TaskId, { chapterId: 'act_1', before: null });
    expect(teamOf(moved, 'sub_1')).toBe(TILL);
  });
});

describe('adding a task for a team', () => {
  it('gives a new top-level task to the team', () => {
    const added = addTask(map, { id: 'tsk_new' as TaskId, name: 'New', to: { chapterId: 'act_1' }, teamId: BENCH });
    expect(teamOf(added, 'tsk_new')).toBe(BENCH);
  });

  it('gives a new subtask a team of its own', () => {
    const added = addTask(map, {
      id: 'sub_new' as TaskId,
      name: 'New',
      to: { parentId: 'tsk_1' as TaskId },
      teamId: TILL,
    });
    expect(subTeamOf(added, 'sub_new')).toBe(TILL);
  });

  it('leaves a new subtask following its task when it’s given its task’s team', () => {
    const added = addTask(map, {
      id: 'sub_new' as TaskId,
      name: 'New',
      to: { parentId: 'tsk_1' as TaskId },
      teamId: BENCH,
    });
    expect(subTeamOf(added, 'sub_new')).toBeNull();
  });

  it('refuses a team that isn’t on the map for a new subtask', () => {
    expect(() =>
      addTask(map, {
        id: 'sub_new' as TaskId,
        name: 'New',
        to: { parentId: 'tsk_1' as TaskId },
        teamId: 'tm_none' as TeamId,
      }),
    ).toThrow(expect.objectContaining({ code: 'TEAM_NOT_FOUND' }));
  });
});

describe('moving a task under another', () => {
  it('follows the new task when it had no team', () => {
    const { map: moved } = moveTaskInMap(map, 'tsk_2' as TaskId, { parentId: 'tsk_1' as TaskId, before: null });
    const parent = moved.activities[0]?.tasks.find((task) => task.id === 'tsk_1');
    expect(parent?.subtasks.map((sub) => sub.id)).toContain('tsk_2');
    expect(parent?.teamId).toBe(BENCH);
    expect(subTeamOf(moved, 'tsk_2')).toBeNull();
  });

  it('keeps a team that differs from the new task’s', () => {
    const tills = assignTeam(map, 'tsk_2' as TaskId, TILL);
    const { map: moved } = moveTaskInMap(tills, 'tsk_2' as TaskId, { parentId: 'tsk_1' as TaskId, before: null });
    expect(subTeamOf(moved, 'tsk_2')).toBe(TILL);
  });

  it('follows the new task when it had the same team', () => {
    const benches = assignTeam(map, 'tsk_2' as TaskId, BENCH);
    const { map: moved } = moveTaskInMap(benches, 'tsk_2' as TaskId, { parentId: 'tsk_1' as TaskId, before: null });
    expect(subTeamOf(moved, 'tsk_2')).toBeNull();
  });

  it('keeps its own team when a subtask moves to another task', () => {
    const own = assignTeam(
      {
        ...map,
        activities: map.activities.map((a) => ({
          ...a,
          tasks: a.tasks.map((t) => (t.id === 'tsk_2' ? { ...t, teamId: BENCH } : t)),
        })),
      },
      'sub_1' as TaskId,
      TILL,
    );
    const { map: moved } = moveTaskInMap(own, 'sub_1' as TaskId, { parentId: 'tsk_2' as TaskId, before: null });
    expect(subTeamOf(moved, 'sub_1')).toBe(TILL);
  });
});

describe('addTeam', () => {
  it('adds a team at the end, with its name tidied', () => {
    const added = addTeam(map, { id: 'tm_till' as TeamId, name: '  Till \n' });
    expect(added.teams.map((team) => team.name)).toEqual(['Bench', 'Till', 'Till']);
    expect(added.teams[2]).toEqual({ id: 'tm_till', name: 'Till' });
  });

  it('refuses an empty name', () => {
    expect(() => addTeam(map, { id: 'tm_x' as TeamId, name: '   ' })).toThrow(
      expect.objectContaining({ code: 'NAME_EMPTY' }),
    );
  });
});

describe('renameTeam', () => {
  it('renames a team, and its tasks keep it', () => {
    const renamed = renameTeam(map, BENCH, 'Workbench');
    expect(renamed.teams[0]).toEqual({ id: BENCH, name: 'Workbench' });
    expect(teamOf(renamed, 'tsk_1')).toBe(BENCH);
  });

  it('refuses a team that isn’t on the map', () => {
    expect(() => renameTeam(map, 'tm_none' as TeamId, 'Name')).toThrow(
      expect.objectContaining({ code: 'TEAM_NOT_FOUND' }),
    );
  });
});

describe('removeTeam', () => {
  const two: StoryMap = {
    ...map,
    activities: map.activities.map((activity) => ({
      ...activity,
      tasks: [...activity.tasks, { id: 'tsk_3' as TaskId, name: 'Tills', teamId: TILL, subtasks: [] }],
    })),
  };

  it('takes the team off the map', () => {
    expect(removeTeam(two, BENCH).teams).toEqual([{ id: 'tm_till', name: 'Till' }]);
  });

  it('leaves its tasks with no team, and everything else as it was', () => {
    const removed = removeTeam(two, BENCH);
    expect(teamOf(removed, 'tsk_1')).toBeNull();
    expect('teamId' in (removed.activities[0]?.tasks[0] ?? {})).toBe(false);
    expect(removed.activities[0]?.tasks[0]?.subtasks).toHaveLength(1);
    expect(teamOf(removed, 'tsk_3')).toBe('tm_till');
  });

  it('leaves its subtasks following their task again', () => {
    const removed = removeTeam(assignTeam(two, 'sub_1' as TaskId, TILL), TILL);
    expect(subTeamOf(removed, 'sub_1')).toBeNull();
    expect('teamId' in (removed.activities[0]?.tasks[0]?.subtasks[0] ?? {})).toBe(false);
  });

  it('refuses a team that isn’t on the map', () => {
    expect(() => removeTeam(map, 'tm_none' as TeamId)).toThrow(expect.objectContaining({ code: 'TEAM_NOT_FOUND' }));
  });
});
