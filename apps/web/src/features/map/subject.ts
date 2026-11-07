import type { Light, MapView } from '@litmus/core';

/** Whatever the drawer is showing. */
export type Subject =
  | {
      kind: 'team';
      id: string;
      name: string;
      path: string;
      /** Only chapters holding the team's tasks, in story order. */
      chapters: { id: string; name: string; tasks: { id: string; name: string; light: Light }[] }[];
    }
  | { kind: 'chapter'; id: string; name: string; chapterId: string; path: string }
  | { kind: 'step'; id: string; name: string; note: string; chapterId: string; path: string; personaIds: string[] }
  | {
      kind: 'task' | 'subtask';
      id: string;
      name: string;
      chapterId: string;
      path: string;
      /** A subtask shows its task's team, because that's where it's set. */
      teamId: string | null;
      /** Set on this one. */
      ownPersonaIds: string[];
      /** Its own and everything beneath it. */
      personaIds: string[];
      light: Light;
      review: string | null;
      earlierReview: string | null;
      /** Empty unless this task's light follows from its subtasks. */
      subtasks: { id: string; name: string; light: Light; personaIds: string[] }[];
      /** Only a subtask has these. */
      steps: { id: string; name: string; personaIds: string[] }[];
    };

export function findSubject(map: MapView, id: string): Subject | null {
  const team = map.teams.find((other) => other.id === id);
  if (team) {
    const chapters = map.activities
      .map((chapter) => ({
        id: chapter.id,
        name: chapter.name,
        tasks: chapter.tasks
          .filter((task) => task.teamId === id)
          .map((task) => ({ id: task.id, name: task.name, light: task.light })),
      }))
      .filter((chapter) => chapter.tasks.length > 0);
    return { kind: 'team', id, name: team.name, path: 'Team', chapters };
  }

  for (const [index, chapter] of map.activities.entries()) {
    const place = `Chapter ${String(index + 1)}`;
    if (chapter.id === id) return { kind: 'chapter', id, name: chapter.name, chapterId: chapter.id, path: place };

    for (const task of chapter.tasks) {
      if (task.id === id) {
        return {
          kind: 'task',
          id,
          name: task.name,
          chapterId: chapter.id,
          path: `${place} · ${chapter.name}`,
          teamId: task.teamId,
          ownPersonaIds: task.ownPersonaIds,
          personaIds: task.personaIds,
          light: task.light,
          review: task.review,
          earlierReview: task.earlierReview,
          subtasks: task.subtasks,
          steps: [],
        };
      }
      for (const sub of task.subtasks) {
        if (sub.id === id) {
          return {
            kind: 'subtask',
            id,
            name: sub.name,
            chapterId: chapter.id,
            path: `${place} · ${chapter.name} · ${task.name}`,
            teamId: task.teamId,
            ownPersonaIds: sub.ownPersonaIds,
            personaIds: sub.personaIds,
            light: sub.light,
            review: sub.review,
            earlierReview: null,
            subtasks: [],
            steps: sub.steps,
          };
        }
        const step = sub.steps.find((other) => other.id === id);
        if (step) {
          return {
            kind: 'step',
            id,
            name: step.name,
            note: step.note,
            personaIds: step.personaIds,
            chapterId: chapter.id,
            path: `${place} · ${chapter.name} · ${task.name} · ${sub.name}`,
          };
        }
      }
    }
  }
  return null;
}
