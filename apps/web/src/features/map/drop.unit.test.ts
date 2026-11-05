import type { MapView } from '@litmus/core';
import { describe, expect, it } from 'vitest';
import { destinationFor, moveChoices, stepDestination, zoneFor } from './drop';

const task = (id: string, name: string, subtasks: string[] = []) => ({
  id,
  name,
  light: 'grey' as const,
  review: null,
  earlierReview: null,
  mix: [],
  subtasks: subtasks.map((sub) => ({ id: sub, name: sub.toUpperCase(), light: 'grey' as const, review: null })),
});

const map: MapView = {
  id: 'map_1',
  name: 'A small map',
  productName: 'Thing',
  activities: [
    { id: 'act_1', name: 'First', mix: [], tasks: [task('a', 'A'), task('b', 'B', ['b1', 'b2']), task('c', 'C')] },
    { id: 'act_2', name: 'Second', mix: [], tasks: [task('d', 'D')] },
  ],
};

describe('zoneFor', () => {
  it('splits a row into thirds when nesting is allowed', () => {
    expect(zoneFor(0.1, true)).toBe('before');
    expect(zoneFor(0.5, true)).toBe('inside');
    expect(zoneFor(0.9, true)).toBe('after');
  });

  it('splits it in half when nesting isn’t', () => {
    expect(zoneFor(0.49, false)).toBe('before');
    expect(zoneFor(0.51, false)).toBe('after');
  });
});

describe('destinationFor', () => {
  it('places a task before another', () => {
    expect(destinationFor(map, 'c', { overId: 'a', zone: 'before' })).toEqual({ chapterId: 'act_1', before: 'a' });
  });

  it('places a task after another, by naming the next one', () => {
    expect(destinationFor(map, 'c', { overId: 'a', zone: 'after' })).toEqual({ chapterId: 'act_1', before: 'b' });
  });

  it('places a task after the last one, at the end', () => {
    expect(destinationFor(map, 'a', { overId: 'd', zone: 'after' })).toEqual({ chapterId: 'act_2', before: null });
  });

  it('places a task inside another', () => {
    expect(destinationFor(map, 'a', { overId: 'c', zone: 'inside' })).toEqual({ parentId: 'c', before: null });
  });

  it('places a task among subtasks', () => {
    expect(destinationFor(map, 'a', { overId: 'b2', zone: 'before' })).toEqual({ parentId: 'b', before: 'b2' });
    expect(destinationFor(map, 'a', { overId: 'b2', zone: 'after' })).toEqual({ parentId: 'b', before: null });
  });

  it('places a task at the end of a chapter', () => {
    expect(destinationFor(map, 'a', { overId: 'act_2', zone: 'end' })).toEqual({ chapterId: 'act_2', before: null });
  });

  it('skips itself when working out what comes next', () => {
    expect(destinationFor(map, 'b', { overId: 'a', zone: 'after' })).toEqual({ chapterId: 'act_1', before: 'c' });
  });

  it('refuses to drop a task on itself', () => {
    expect(destinationFor(map, 'a', { overId: 'a', zone: 'before' })).toBeNull();
  });

  it('refuses a drop that would make three levels', () => {
    expect(destinationFor(map, 'b', { overId: 'a', zone: 'inside' })).toBeNull();
    expect(destinationFor(map, 'b', { overId: 'b1', zone: 'before' })).toBeNull();
    expect(destinationFor(map, 'a', { overId: 'b1', zone: 'inside' })).toBeNull();
  });
});

describe('stepDestination', () => {
  it('moves a task up one', () => {
    expect(stepDestination(map, 'b', -1)).toEqual({ chapterId: 'act_1', before: 'a' });
  });

  it('moves a task down one', () => {
    expect(stepDestination(map, 'a', 1)).toEqual({ chapterId: 'act_1', before: 'c' });
  });

  it('moves the second to last to the end', () => {
    expect(stepDestination(map, 'b', 1)).toEqual({ chapterId: 'act_1', before: null });
  });

  it('moves subtasks within their parent', () => {
    expect(stepDestination(map, 'b2', -1)).toEqual({ parentId: 'b', before: 'b1' });
  });

  it('has nowhere to go at either end', () => {
    expect(stepDestination(map, 'a', -1)).toBeNull();
    expect(stepDestination(map, 'c', 1)).toBeNull();
  });
});

describe('moveChoices', () => {
  const labels = (id: string) => moveChoices(map, id).flatMap((group) => group.choices.map((choice) => choice.label));

  it('offers each chapter, and each task to go inside', () => {
    expect(labels('a')).toEqual(['End of First', 'Inside B', 'Inside C', 'End of Second', 'Inside D']);
  });

  it('never offers a task itself', () => {
    expect(labels('c')).not.toContain('Inside C');
  });

  it('offers no insides for a task with subtasks', () => {
    expect(labels('b')).toEqual(['End of First', 'End of Second']);
  });

  it('groups choices by chapter, in story order', () => {
    expect(moveChoices(map, 'a').map((group) => group.chapter)).toEqual(['First', 'Second']);
  });
});
