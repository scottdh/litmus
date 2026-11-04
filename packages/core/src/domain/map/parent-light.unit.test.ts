import { describe, expect, it } from 'vitest';
import { DomainError } from '../../kernel/errors.ts';
import type { Light } from './light.ts';
import { deriveParentLight } from './parent-light.ts';

describe('deriveParentLight', () => {
  it.each<[Light[], Light]>([
    [['green'], 'green'],
    [['green', 'green', 'green'], 'green'],
    [['red'], 'red'],
    [['red', 'red'], 'red'],
    [['grey', 'grey'], 'red'],
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
  });

  it('is out of scope when every subtask is', () => {
    expect(deriveParentLight(['out-of-scope', 'out-of-scope'])).toBe('out-of-scope');
  });

  it('refuses a parent with no subtasks', () => {
    expect(() => deriveParentLight([])).toThrow(DomainError);
  });
});
