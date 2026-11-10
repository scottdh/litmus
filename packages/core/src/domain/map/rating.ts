import type { Instant } from '../../kernel/clock.ts';
import { invariantViolation } from '../../kernel/errors.ts';
import type { Evidence } from './evidence.ts';
import type { Light } from './light.ts';
import type { ProductId, TaskId } from './story-map.ts';

/** One light for one task on one product, at one moment. Ratings form an append-only log; the latest sets the light. */
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

/** Oldest first. Ratings made at the same moment keep their order in the log. */
export const byRatedAt = (ratings: readonly Rating[]): Rating[] =>
  [...ratings].sort((a, b) => (a.ratedAt < b.ratedAt ? -1 : a.ratedAt > b.ratedAt ? 1 : 0));

/** The rating that sets each task's light now. */
export const latestRatings = (ratings: readonly Rating[]): Map<TaskId, Rating> =>
  new Map(byRatedAt(ratings).map((rating) => [rating.subjectId, rating]));

/** The review written with a rating, if any. */
export const noteOf = (rating: Rating | undefined): string | null =>
  rating?.evidence.find((item) => item.kind === 'note')?.text ?? null;
