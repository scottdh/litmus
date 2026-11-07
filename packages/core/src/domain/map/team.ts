import { notFound } from '../../kernel/errors.ts';
import { tidyName } from './rename.ts';
import type { StoryMap, TaskId, TeamId } from './story-map.ts';

/** Takes only the team away, so everything else set on the task or subtask stays. */
function withoutTeam<T extends { teamId?: TeamId }>(task: T): T {
  const rest = { ...task };
  delete rest.teamId;
  return rest;
}

/** A subtask given its task's team follows the task, so it stays with it if the task changes hands. */
export function withTeam<T extends { teamId?: TeamId }>(task: T, teamId: TeamId | null, following?: TeamId): T {
  return teamId === null || teamId === following ? withoutTeam(task) : { ...task, teamId };
}

/** New teams go at the end of the list, with no tasks. */
export function addTeam(map: StoryMap, input: { id: TeamId; name: string }): StoryMap {
  return { ...map, teams: [...map.teams, { id: input.id, name: tidyName(input.name) }] };
}

export function renameTeam(map: StoryMap, id: TeamId, name: string): StoryMap {
  const tidied = tidyName(name);
  if (!map.teams.some((team) => team.id === id)) throw notFound('TEAM_NOT_FOUND', `No team with id ${id}.`);
  return { ...map, teams: map.teams.map((team) => (team.id === id ? { ...team, name: tidied } : team)) };
}

/** Takes a team off the map. Its tasks stay, with no team, and its subtasks follow their task again. */
export function removeTeam(map: StoryMap, id: TeamId): StoryMap {
  if (!map.teams.some((team) => team.id === id)) throw notFound('TEAM_NOT_FOUND', `No team with id ${id}.`);
  return {
    ...map,
    teams: map.teams.filter((team) => team.id !== id),
    activities: map.activities.map((activity) => ({
      ...activity,
      tasks: activity.tasks.map((task) => {
        const kept = task.teamId === id ? withoutTeam(task) : task;
        return { ...kept, subtasks: kept.subtasks.map((sub) => (sub.teamId === id ? withoutTeam(sub) : sub)) };
      }),
    })),
  };
}

/**
 * Gives a task or subtask to a team, or takes it away with null.
 * A subtask given null, or its task's own team, follows its task again.
 */
export function assignTeam(map: StoryMap, taskId: TaskId, teamId: TeamId | null): StoryMap {
  if (teamId !== null && !map.teams.some((team) => team.id === teamId)) {
    throw notFound('TEAM_NOT_FOUND', `No team with id ${teamId}.`);
  }
  const tasks = map.activities.flatMap((activity) => activity.tasks);
  if (!tasks.some((task) => task.id === taskId || task.subtasks.some((sub) => sub.id === taskId))) {
    throw notFound('TASK_NOT_FOUND', `No task with id ${taskId}.`);
  }
  return {
    ...map,
    activities: map.activities.map((activity) => ({
      ...activity,
      tasks: activity.tasks.map((task) => {
        if (task.id === taskId) return withTeam(task, teamId);
        if (!task.subtasks.some((sub) => sub.id === taskId)) return task;
        return {
          ...task,
          subtasks: task.subtasks.map((sub) => (sub.id === taskId ? withTeam(sub, teamId, task.teamId) : sub)),
        };
      }),
    })),
  };
}
