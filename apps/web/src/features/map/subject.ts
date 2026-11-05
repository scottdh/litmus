import type { Light, MapView } from '@litmus/core';

/** Whatever the drawer is showing. */
export type Subject =
  | { kind: 'chapter'; id: string; name: string; chapterId: string; path: string }
  | { kind: 'step'; id: string; name: string; note: string; chapterId: string; path: string }
  | {
      kind: 'task' | 'subtask';
      id: string;
      name: string;
      chapterId: string;
      path: string;
      light: Light;
      review: string | null;
      earlierReview: string | null;
      /** Empty unless this task's light follows from its subtasks. */
      subtasks: { id: string; name: string; light: Light }[];
      /** Only a subtask has these. */
      steps: { id: string; name: string }[];
    };

export function findSubject(map: MapView, id: string): Subject | null {
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
            chapterId: chapter.id,
            path: `${place} · ${chapter.name} · ${task.name} · ${sub.name}`,
          };
        }
      }
    }
  }
  return null;
}
