import { describe, expect, it } from 'vitest';
import type { MapId, StoryMap, TaskId, TeamId } from './story-map.ts';
import { assignTeam } from './team.ts';
import { moveTaskInMap } from './move.ts';
import { addTask } from './add.ts';

const BENCH = 'tm_bench' as TeamId;

const map: StoryMap = {
  id: 'map_1' as MapId,
  name: 'A small map',
  teams: [{ id: BENCH, name: 'Bench' }],
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

  it('refuses a subtask, which shares its task’s team', () => {
    expect(() => assignTeam(map, 'sub_1' as TaskId, BENCH)).toThrow(
      expect.objectContaining({ code: 'TEAM_IS_ON_THE_TASK' }),
    );
  });

  it('keeps the team when a subtask becomes a task', () => {
    const { map: moved } = moveTaskInMap(map, 'sub_1' as TaskId, { chapterId: 'act_1', before: null });
    expect(teamOf(moved, 'sub_1')).toBe(BENCH);
  });
});

describe('adding a task for a team', () => {
  it('gives a new top-level task to the team', () => {
    const added = addTask(map, { id: 'tsk_new' as TaskId, name: 'New', to: { chapterId: 'act_1' }, teamId: BENCH });
    expect(teamOf(added, 'tsk_new')).toBe(BENCH);
  });

  it('refuses a team for a new subtask', () => {
    expect(() =>
      addTask(map, { id: 'sub_new' as TaskId, name: 'New', to: { parentId: 'tsk_1' as TaskId }, teamId: BENCH }),
    ).toThrow(expect.objectContaining({ code: 'TEAM_IS_ON_THE_TASK' }));
  });
});

describe('moving a task under another', () => {
  it('takes on the new parent’s team, because only the task holds one', () => {
    const { map: moved } = moveTaskInMap(map, 'tsk_2' as TaskId, { parentId: 'tsk_1' as TaskId, before: null });
    const parent = moved.activities[0]?.tasks.find((task) => task.id === 'tsk_1');
    expect(parent?.subtasks.map((sub) => sub.id)).toContain('tsk_2');
    expect(parent?.teamId).toBe(BENCH);
  });
});
