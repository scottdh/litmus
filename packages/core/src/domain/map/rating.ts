import type { Instant } from '../../kernel/clock.ts';
import { invariantViolation } from '../../kernel/errors.ts';
import type { Evidence } from './evidence.ts';
import type { Light } from './light.ts';
import type { ProductId, TaskId } from './story-map.ts';

/** One light for one task on one product. */
export interface Rating {
  subjectId: TaskId;
  productId: ProductId;
  light: Light;
  evidence: Evidence[];
  ratedAt: Instant;
}

export const needsEvidence = (light: Light) => light === 'green' || light === 'yellow' || light === 'red';

const hasMaterialViolation = (evidence: Evidence[]) =>
  evidence.some(
    (item) =>
      item.kind === 'heuristic-review' && item.violations.some((violation) => violation.severity !== 'cosmetic'),
  );

export function createRating(rating: Rating): Rating {
  if (needsEvidence(rating.light) && rating.evidence.length === 0) {
    throw invariantViolation('RATING_NEEDS_EVIDENCE', `A ${rating.light} rating needs at least one piece of evidence.`);
  }
  if (rating.light === 'green' && hasMaterialViolation(rating.evidence)) {
    throw invariantViolation('GREEN_HAS_MATERIAL_VIOLATION', 'Green can carry cosmetic violations only.');
  }
  return rating;
}
