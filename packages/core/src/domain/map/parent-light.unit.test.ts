import { describe, expect, it } from 'vitest';
import { DomainError } from '../../kernel/errors.ts';
import type { Instant } from '../../kernel/clock.ts';
import type { Light } from './light.ts';
import { deriveParentLight, replayParentLight } from './parent-light.ts';
import type { Rating } from './rating.ts';
import type { ProductId, TaskId } from './story-map.ts';

describe('deriveParentLight', () => {
  it.each<[Light[], Light]>([
    [['green'], 'green'],
    [['green', 'green', 'green'], 'green'],
    [['red'], 'red'],
    [['red', 'red'], 'red'],
    [['grey'], 'grey'],
    [['grey', 'grey'], 'grey'],
    [['red', 'grey'], 'red'],
    [['yellow'], 'yellow'],
    [['yellow', 'yellow'], 'yellow'],
    [['green', 'yellow'], 'yellow'],
    [['green', 'red'], 'yellow'],
    [['green', 'grey'], 'yellow'],
    [['yellow', 'red'], 'yellow'],
    [['yellow', 'grey'], 'yellow'],
    [['green', 'yellow', 'red', 'grey'], 'yellow'],
  ])('%j gives %s', (subtasks, parent) => {
    expect(deriveParentLight(subtasks)).toBe(parent);
  });

  it('leaves out-of-scope subtasks out of the rule', () => {
    expect(deriveParentLight(['green', 'out-of-scope'])).toBe('green');
    expect(deriveParentLight(['red', 'out-of-scope'])).toBe('red');
    expect(deriveParentLight(['green', 'red', 'out-of-scope'])).toBe('yellow');
    expect(deriveParentLight(['grey', 'out-of-scope'])).toBe('grey');
  });

  it('is out of scope when every subtask is', () => {
    expect(deriveParentLight(['out-of-scope', 'out-of-scope'])).toBe('out-of-scope');
  });

  it('refuses a parent with no subtasks', () => {
    expect(() => deriveParentLight([])).toThrow(DomainError);
  });
});

describe('replayParentLight', () => {
  const A = 'tsk_a' as TaskId;
  const B = 'tsk_b' as TaskId;
  const rating = (subjectId: TaskId, light: Light, day: number): Rating => ({
    subjectId,
    productId: 'prd_1' as ProductId,
    light,
    evidence: [],
    ratedAt: `2026-11-0${String(day)}T09:00:00.000Z` as Instant,
  });
  const moves = (changes: ReturnType<typeof replayParentLight>) =>
    changes.map((change) => [change.rating.subjectId, change.from, change.to]);

  it('replays the subtasks’ logs in the order they were rated, keeping only changes to the parent', () => {
    const log = [rating(B, 'green', 3), rating(A, 'red', 1), rating(B, 'red', 2), rating(A, 'green', 4)];
    expect(moves(replayParentLight([A, B], log))).toEqual([
      [A, 'grey', 'red'],
      [B, 'red', 'yellow'],
      [A, 'yellow', 'green'],
    ]);
  });

  it('skips a rating that leaves the parent where it was', () => {
    const log = [rating(A, 'red', 1), rating(B, 'red', 2), rating(A, 'red', 3)];
    expect(moves(replayParentLight([A, B], log))).toEqual([[A, 'grey', 'red']]);
  });

  it('ignores ratings for anything that is not one of its subtasks now', () => {
    const log = [rating('tsk_gone' as TaskId, 'green', 1), rating(A, 'green', 2)];
    expect(moves(replayParentLight([A], log))).toEqual([[A, 'grey', 'green']]);
  });

  it('gives nothing when no subtask has been rated', () => {
    expect(replayParentLight([A, B], [])).toEqual([]);
  });
});
