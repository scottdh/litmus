import type { Light, MapView } from '@litmus/core';

/** Whatever the drawer is showing. */
export type Subject =
  | { kind: 'chapter'; id: string; name: string; chapterId: string; path: string }
  | {
      kind: 'task' | 'subtask';
      id: string;
      name: string;
      chapterId: string;
      path: string;
      light: Light;
      lightFollowsSubtasks: boolean;
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
          lightFollowsSubtasks: task.subtasks.length > 0,
        };
      }
      const sub = task.subtasks.find((other) => other.id === id);
      if (sub) {
        return {
          kind: 'subtask',
          id,
          name: sub.name,
          chapterId: chapter.id,
          path: `${place} · ${chapter.name} · ${task.name}`,
          light: sub.light,
          lightFollowsSubtasks: false,
        };
      }
    }
  }
  return null;
}
