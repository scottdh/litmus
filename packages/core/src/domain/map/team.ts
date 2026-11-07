import { invariantViolation, notFound } from '../../kernel/errors.ts';
import type { StoryMap, TaskId, TeamId } from './story-map.ts';

/** Gives a top-level task to a team, or takes it away with null. Subtasks share their task's team. */
export function assignTeam(map: StoryMap, taskId: TaskId, teamId: TeamId | null): StoryMap {
  if (teamId !== null && !map.teams.some((team) => team.id === teamId)) {
    throw notFound('TEAM_NOT_FOUND', `No team with id ${teamId}.`);
  }
  const tasks = map.activities.flatMap((activity) => activity.tasks);
  if (!tasks.some((task) => task.id === taskId)) {
    if (tasks.some((task) => task.subtasks.some((sub) => sub.id === taskId))) {
      throw invariantViolation('TEAM_IS_ON_THE_TASK', 'A subtask shares its task’s team.');
    }
    throw notFound('TASK_NOT_FOUND', `No task with id ${taskId}.`);
  }
  return {
    ...map,
    activities: map.activities.map((activity) => ({
      ...activity,
      tasks: activity.tasks.map((task) => {
        if (task.id !== taskId) return task;
        if (teamId !== null) return { ...task, teamId };
        const { id, name, subtasks } = task;
        return { id, name, subtasks };
      }),
    })),
  };
}
