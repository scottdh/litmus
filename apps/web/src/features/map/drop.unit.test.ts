import type { MapView } from '@litmus/core';
import { describe, expect, it } from 'vitest';
import { describeDestination, destinationFor, hoverZone, moveChoices, stepDestination, zoneFor } from './drop';

const task = (id: string, name: string, subtasks: string[] = []) => ({
  id,
  name,
  light: 'grey' as const,
  review: null,
  earlierReview: null,
  mix: [],
  subtasks: subtasks.map((sub) => ({
    id: sub,
    name: sub.toUpperCase(),
    light: 'grey' as const,
    review: null,
    steps: [] as { id: string; name: string; note: string }[],
  })),
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

describe('a subtask with steps', () => {
  const withSteps: MapView = {
    ...map,
    activities: map.activities.map((chapter) => ({
      ...chapter,
      tasks: chapter.tasks.map((item) => ({
        ...item,
        subtasks: item.subtasks.map((sub) =>
          sub.id === 'b1' ? { ...sub, steps: [{ id: 'stp_1', name: 'A step', note: '' }] } : sub,
        ),
      })),
    })),
  };

  it('can’t be dropped among tasks or at the end of a chapter', () => {
    expect(destinationFor(withSteps, 'b1', { overId: 'a', zone: 'before' })).toBeNull();
    expect(destinationFor(withSteps, 'b1', { overId: 'act_2', zone: 'end' })).toBeNull();
  });

  it('can still go among subtasks or inside another task', () => {
    expect(destinationFor(withSteps, 'b1', { overId: 'b2', zone: 'after' })).toEqual({ parentId: 'b', before: null });
    expect(destinationFor(withSteps, 'b1', { overId: 'c', zone: 'inside' })).toEqual({ parentId: 'c', before: null });
  });

  it('isn’t offered the end of a chapter in Move to', () => {
    const labels = moveChoices(withSteps, 'b1').flatMap((group) => group.choices.map((choice) => choice.label));
    expect(labels).not.toContain('End of First');
    expect(labels).toContain('Inside C');
  });
});

describe('moving a step', () => {
  const steps = (...ids: string[]) => ids.map((value) => ({ id: value, name: value.toUpperCase(), note: '' }));
  const withSteps: MapView = {
    ...map,
    activities: map.activities.map((chapter) => ({
      ...chapter,
      tasks: chapter.tasks.map((item) => ({
        ...item,
        subtasks: item.subtasks.map((sub) => (sub.id === 'b1' ? { ...sub, steps: steps('s1', 's2', 's3') } : sub)),
      })),
    })),
  };

  it('treats a subtask as somewhere to drop into, and a step as a place among steps', () => {
    expect(hoverZone(withSteps, 's1', 'b2', 0.1)).toBe('inside');
    expect(hoverZone(withSteps, 's1', 's2', 0.4)).toBe('before');
    expect(hoverZone(withSteps, 's1', 's2', 0.6)).toBe('after');
  });

  it('keeps the usual zones for tasks', () => {
    expect(hoverZone(withSteps, 'a', 'c', 0.5)).toBe('inside');
    expect(hoverZone(withSteps, 'a', 'b1', 0.5)).toBe('after');
  });

  it('places a step before or after another', () => {
    expect(destinationFor(withSteps, 's3', { overId: 's1', zone: 'before' })).toEqual({
      subtaskId: 'b1',
      before: 's1',
    });
    expect(destinationFor(withSteps, 's1', { overId: 's2', zone: 'after' })).toEqual({ subtaskId: 'b1', before: 's3' });
    expect(destinationFor(withSteps, 's1', { overId: 's3', zone: 'after' })).toEqual({ subtaskId: 'b1', before: null });
  });

  it('drops a step into another subtask, at the end', () => {
    expect(destinationFor(withSteps, 's1', { overId: 'b2', zone: 'inside' })).toEqual({
      subtaskId: 'b2',
      before: null,
    });
  });

  it('won’t let a step become a task or subtask', () => {
    expect(destinationFor(withSteps, 's1', { overId: 'a', zone: 'before' })).toBeNull();
    expect(destinationFor(withSteps, 's1', { overId: 'c', zone: 'inside' })).toBeNull();
    expect(destinationFor(withSteps, 's1', { overId: 'b2', zone: 'before' })).toBeNull();
    expect(destinationFor(withSteps, 's1', { overId: 'act_2', zone: 'end' })).toBeNull();
  });

  it('won’t let a task or subtask go among steps', () => {
    expect(destinationFor(withSteps, 'a', { overId: 's1', zone: 'before' })).toBeNull();
    expect(destinationFor(withSteps, 'b2', { overId: 's1', zone: 'after' })).toBeNull();
  });

  it('moves one place at a time within its subtask', () => {
    expect(stepDestination(withSteps, 's2', -1)).toEqual({ subtaskId: 'b1', before: 's1' });
    expect(stepDestination(withSteps, 's2', 1)).toEqual({ subtaskId: 'b1', before: null });
    expect(stepDestination(withSteps, 's1', -1)).toBeNull();
    expect(stepDestination(withSteps, 's3', 1)).toBeNull();
  });

  it('offers every subtask in Move to, and nothing else', () => {
    const groups = moveChoices(withSteps, 's1');
    expect(groups.map((group) => group.chapter)).toEqual(['First']);
    expect(groups.flatMap((group) => group.choices.map((choice) => choice.label))).toEqual(['Inside B1', 'Inside B2']);
  });

  it('names the subtask it went to', () => {
    expect(describeDestination(withSteps, { subtaskId: 'b2', before: null })).toBe('B2');
  });
});
