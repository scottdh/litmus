import { invariantViolation } from '../../kernel/errors.ts';
import type { Light } from './light.ts';
import { byRatedAt, type Rating } from './rating.ts';
import type { TaskId } from './story-map.ts';

/** See "Tasks with subtasks" in docs/product/rating-model.md. Nothing here averages. */
export function deriveParentLight(subtasks: Light[]): Light {
  if (subtasks.length === 0) {
    throw invariantViolation('PARENT_NEEDS_SUBTASKS', 'A parent light needs at least one subtask.');
  }
  const counted = subtasks.filter((light) => light !== 'out-of-scope');
  if (counted.length === 0) return 'out-of-scope';
  if (counted.every((light) => light === 'green')) return 'green';
  if (counted.every((light) => light === 'grey')) return 'grey';
  if (counted.every((light) => light === 'red' || light === 'grey')) return 'red';
  return 'yellow';
}

/** A rating of a subtask that moved its parent's light. */
export interface ParentChange {
  rating: Rating;
  from: Light;
  to: Light;
}

/**
 * Replays the logs of a parent's subtasks now, oldest first, and keeps only the ratings that changed its derived light.
 * Worked out, not stored, so it can't disagree with the subtasks. See docs/designs/task-view-direction.md.
 */
export function replayParentLight(subtaskIds: readonly TaskId[], ratings: readonly Rating[]): ParentChange[] {
  if (subtaskIds.length === 0) return [];
  const lights = new Map<TaskId, Light>(subtaskIds.map((id) => [id, 'grey']));
  let current = deriveParentLight([...lights.values()]);
  const changes: ParentChange[] = [];
  for (const rating of byRatedAt(ratings)) {
    if (!lights.has(rating.subjectId)) continue;
    lights.set(rating.subjectId, rating.light);
    const next = deriveParentLight([...lights.values()]);
    if (next !== current) changes.push({ rating, from: current, to: next });
    current = next;
  }
  return changes;
}
