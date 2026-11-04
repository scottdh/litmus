import { invariantViolation } from '../../kernel/errors.ts';
import type { Light } from './light.ts';

/** See "Tasks with subtasks" in docs/product/rating-model.md. Nothing here averages. */
export function deriveParentLight(subtasks: Light[]): Light {
  if (subtasks.length === 0) {
    throw invariantViolation('PARENT_NEEDS_SUBTASKS', 'A parent light needs at least one subtask.');
  }
  const counted = subtasks.filter((light) => light !== 'out-of-scope');
  if (counted.length === 0) return 'out-of-scope';
  if (counted.every((light) => light === 'green')) return 'green';
  if (counted.every((light) => light === 'red' || light === 'grey')) return 'red';
  return 'yellow';
}
