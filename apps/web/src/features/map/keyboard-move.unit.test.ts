import type { MapView } from '@litmus/core';
import { describe, expect, it } from 'vitest';
import { chapterSlot, describeSlot, keyboardSlots, nextSlot, startSlot, type Shown } from './keyboard-move';

const step = (id: string) => ({ id, name: id.toUpperCase(), note: '', personaIds: [], research: null });

const sub = (id: string, steps: string[] = []) => ({
  id,
  name: id.toUpperCase(),
  light: 'grey' as const,
  review: null,
  teamId: null,
  ownTeamId: null,
  ownPersonaIds: [],
  personaIds: [],
  research: null,
  steps: steps.map(step),
});

const task = (id: string, subtasks: ReturnType<typeof sub>[] = []) => ({
  id,
  name: id.toUpperCase(),
  teamId: null,
  ownPersonaIds: [],
  personaIds: [],
  light: 'grey' as const,
  review: null,
  earlierReview: null,
  research: null,
  mix: [],
  subtasks,
});

const map: MapView = {
  id: 'map_1',
  name: 'A small map',
  productName: 'Thing',
  teams: [],
  personas: [],
  activities: [
    {
      id: 'act_1',
      name: 'First',
      mix: [],
      tasks: [task('a'), task('b', [sub('b1', ['s1', 's2']), sub('b2')]), task('c')],
    },
    { id: 'act_2', name: 'Second', mix: [], tasks: [task('d', [sub('d1')])] },
  ],
};

const everything: Shown = { chapters: null, open: new Set(['b', 'b1', 'd', 'd1']) };

const places = (id: string, shown: Shown = everything) => keyboardSlots(map, id, shown).map((slot) => slot.to);

describe('keyboardSlots', () => {
  it('walks a task through every place dragging could drop it, in reading order', () => {
    expect(places('a')).toEqual([
      { chapterId: 'act_1', before: 'b' },
      { parentId: 'b', before: 'b1' },
      { parentId: 'b', before: 'b2' },
      { parentId: 'b', before: null },
      { chapterId: 'act_1', before: 'c' },
      { parentId: 'c', before: null },
      { chapterId: 'act_1', before: null },
      { chapterId: 'act_2', before: 'd' },
      { parentId: 'd', before: 'd1' },
      { parentId: 'd', before: null },
      { chapterId: 'act_2', before: null },
    ]);
  });

  it('keeps a task with subtasks at the top level, because nesting stops at two levels', () => {
    expect(places('b')).toEqual([
      { chapterId: 'act_1', before: 'a' },
      { chapterId: 'act_1', before: 'c' },
      { chapterId: 'act_1', before: null },
      { chapterId: 'act_2', before: 'd' },
      { chapterId: 'act_2', before: null },
    ]);
  });

  it('keeps a subtask with steps a subtask, because only subtasks hold steps', () => {
    expect(places('b1')).toEqual([
      { parentId: 'a', before: null },
      { parentId: 'b', before: 'b2' },
      { parentId: 'b', before: null },
      { parentId: 'c', before: null },
      { parentId: 'd', before: 'd1' },
      { parentId: 'd', before: null },
    ]);
  });

  it('only goes inside a folded-up task, at the end, because its subtasks aren’t on show', () => {
    expect(places('a', { chapters: null, open: new Set() })).toEqual([
      { chapterId: 'act_1', before: 'b' },
      { parentId: 'b', before: null },
      { chapterId: 'act_1', before: 'c' },
      { parentId: 'c', before: null },
      { chapterId: 'act_1', before: null },
      { chapterId: 'act_2', before: 'd' },
      { parentId: 'd', before: null },
      { chapterId: 'act_2', before: null },
    ]);
  });

  it('skips chapters folded out of the focus', () => {
    expect(places('a', { chapters: new Set(['act_1']), open: new Set() })).not.toContainEqual({
      chapterId: 'act_2',
      before: null,
    });
  });

  it('keeps a step among steps, in subtasks that are on show', () => {
    expect(places('s1')).toEqual([
      { subtaskId: 'b1', before: 's2' },
      { subtaskId: 'b1', before: null },
      { subtaskId: 'b2', before: null },
      { subtaskId: 'd1', before: null },
    ]);
    expect(places('s2')).toEqual([
      { subtaskId: 'b1', before: 's1' },
      { subtaskId: 'b1', before: null },
      { subtaskId: 'b2', before: null },
      { subtaskId: 'd1', before: null },
    ]);
  });
});

describe('startSlot', () => {
  it('starts where the row already is', () => {
    const slots = keyboardSlots(map, 'c', everything);
    expect(slots[startSlot(map, 'c', slots)]?.to).toEqual({ chapterId: 'act_1', before: null });
    const subSlots = keyboardSlots(map, 'b2', everything);
    expect(subSlots[startSlot(map, 'b2', subSlots)]?.to).toEqual({ parentId: 'b', before: null });
  });
});

describe('nextSlot', () => {
  it('moves one place and stops at either end', () => {
    const slots = keyboardSlots(map, 'a', everything);
    expect(nextSlot(slots, 0, 1)).toBe(1);
    expect(nextSlot(slots, 0, -1)).toBe(0);
    expect(nextSlot(slots, slots.length - 1, 1)).toBe(slots.length - 1);
  });
});

describe('chapterSlot', () => {
  it('jumps to the first place in the next or previous chapter, and stops at either end', () => {
    const slots = keyboardSlots(map, 'a', everything);
    const second = chapterSlot(slots, 2, 1);
    expect(slots[second]?.to).toEqual({ chapterId: 'act_2', before: 'd' });
    expect(slots[chapterSlot(slots, second + 1, -1)]?.to).toEqual({ chapterId: 'act_1', before: 'b' });
    expect(chapterSlot(slots, 2, -1)).toBe(2);
    expect(chapterSlot(slots, second, 1)).toBe(second);
  });
});

describe('describeSlot', () => {
  const say = (id: string, index: number) => {
    const slot = keyboardSlots(map, id, everything)[index];
    if (slot === undefined) throw new Error(`No place ${String(index)} for ${id}`);
    return describeSlot(map, id, slot);
  };

  it('says where it would land, in words', () => {
    expect(say('c', 0)).toBe('Before A, in First');
    expect(say('a', 1)).toBe('Before B1, inside B');
    expect(say('a', 3)).toBe('Inside B, at the end');
    expect(say('a', 5)).toBe('Inside C');
    expect(say('a', 10)).toBe('At the end of Second');
    expect(say('s2', 0)).toBe('Before S1, inside B1');
    expect(say('s1', 2)).toBe('Inside B2');
  });

  it('says when it’s back where it started', () => {
    expect(say('a', 0)).toBe('Back where it was');
  });
});
