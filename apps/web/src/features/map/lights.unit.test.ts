import { describe, expect, it } from 'vitest';
import { describeRating } from './lights';

describe('describeRating', () => {
  it('names the task and its new light', () => {
    expect(describeRating('Check the brakes', 'red', 'yellow')).toBe('Set Check the brakes to yellow.');
  });

  it('words out of scope as a light like any other', () => {
    expect(describeRating('Wash the bike', 'grey', 'out-of-scope')).toBe('Set Wash the bike to out of scope.');
  });

  it('says only the review changed when the light stayed put', () => {
    expect(describeRating('Check the brakes', 'red', 'red')).toBe('Updated the review of Check the brakes.');
  });
});
