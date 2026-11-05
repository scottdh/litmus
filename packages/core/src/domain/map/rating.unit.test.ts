import { describe, expect, it } from 'vitest';
import { DomainError } from '../../kernel/errors.ts';
import type { Instant } from '../../kernel/clock.ts';
import type { ProductId, TaskId } from './story-map.ts';
import type { Evidence } from './evidence.ts';
import type { Light } from './light.ts';
import { createRating } from './rating.ts';

const quote: Evidence = { kind: 'quote', text: 'I gave up and rang them', source: 'Invented interview' };
const note: Evidence = { kind: 'note', text: 'Prices are buried three steps in.' };
const clean: Evidence = { kind: 'heuristic-review', violations: [] };
const reviewWith = (severity: 'cosmetic' | 'minor' | 'major'): Evidence => ({
  kind: 'heuristic-review',
  violations: [{ heuristic: 'Error prevention', severity }],
});

function rate(light: Light, evidence: Evidence[]) {
  return createRating({
    subjectId: 'tsk_1' as TaskId,
    productId: 'prd_1' as ProductId,
    light,
    evidence,
    ratedAt: '2026-11-04T09:00:00.000Z' as Instant,
  });
}

function codeOf(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    if (error instanceof DomainError) return error.code;
    throw error;
  }
  throw new Error('Expected a DomainError');
}

describe('createRating', () => {
  it.each<Light>(['red', 'yellow', 'green'])('refuses %s without evidence', (light) => {
    expect(codeOf(() => rate(light, []))).toBe('RATING_NEEDS_EVIDENCE');
  });

  it.each<Light>(['red', 'yellow', 'green'])('accepts %s with evidence', (light) => {
    expect(rate(light, [quote]).light).toBe(light);
  });

  it.each<Light>(['grey', 'out-of-scope'])('accepts %s without evidence', (light) => {
    expect(rate(light, []).light).toBe(light);
  });

  it('accepts a heuristic review with no violations as evidence for green', () => {
    expect(rate('green', [clean]).light).toBe('green');
  });

  it('lets green carry a cosmetic violation', () => {
    expect(rate('green', [reviewWith('cosmetic')]).light).toBe('green');
  });

  it.each(['minor', 'major'] as const)('refuses green with a %s violation', (severity) => {
    expect(codeOf(() => rate('green', [reviewWith(severity)]))).toBe('GREEN_HAS_MATERIAL_VIOLATION');
  });

  it('lets yellow and red carry material violations', () => {
    expect(rate('yellow', [reviewWith('major')]).light).toBe('yellow');
    expect(rate('red', [reviewWith('major')]).light).toBe('red');
  });
});

describe('a review note', () => {
  it('counts as evidence for yellow', () => {
    expect(rate('yellow', [note]).evidence).toEqual([note]);
  });

  it('counts as evidence for green', () => {
    expect(rate('green', [note]).light).toBe('green');
  });
});
