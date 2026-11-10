import type { MapView } from '@litmus/core';
import { currentDestination, destinationFor, isStep, type Destination, type Hover } from './drop';

/** A place the keyboard can carry a row to: the hover dragging would show there, and where it lands. */
export interface Slot {
  chapterId: string;
  hover: Hover;
  to: Destination;
}

/** What's on show, because the keyboard only visits rows you can see. */
export interface Shown {
  /** Chapters in the focus, or null when nothing is folded. */
  chapters: ReadonlySet<string> | null;
  /** Tasks and subtasks whose children are open. */
  open: ReadonlySet<string>;
}

const same = (a: Destination, b: Destination) => JSON.stringify(a) === JSON.stringify(b);

/** Every place dragging could drop this row, in reading order, so the arrow keys walk them like the eye does. */
export function keyboardSlots(map: MapView, id: string, shown: Shown): Slot[] {
  const step = isStep(map, id);
  const slots: Slot[] = [];
  const offer = (chapterId: string, hover: Hover) => {
    const to = destinationFor(map, id, hover);
    if (to && !slots.some((slot) => same(slot.to, to))) slots.push({ chapterId, hover, to });
  };

  for (const chapter of map.activities) {
    if (shown.chapters && !shown.chapters.has(chapter.id)) continue;
    for (const task of chapter.tasks) {
      if (!step) offer(chapter.id, { overId: task.id, zone: 'before' });
      const taskOpen = task.subtasks.length > 0 && shown.open.has(task.id);
      if (taskOpen) {
        for (const sub of task.subtasks) {
          if (step) {
            if (shown.open.has(sub.id)) {
              for (const each of sub.steps) offer(chapter.id, { overId: each.id, zone: 'before' });
            }
            offer(chapter.id, { overId: sub.id, zone: 'inside' });
          } else {
            offer(chapter.id, { overId: sub.id, zone: 'before' });
          }
        }
      }
      if (!step) offer(chapter.id, { overId: task.id, zone: 'inside' });
    }
    if (!step) offer(chapter.id, { overId: chapter.id, zone: 'end' });
  }
  return slots;
}

/** Where the row already is, so Enter straight away changes nothing. */
export function startSlot(map: MapView, id: string, slots: Slot[]): number {
  const here = currentDestination(map, id);
  const index = here ? slots.findIndex((slot) => same(slot.to, here)) : -1;
  return Math.max(index, 0);
}

export function nextSlot(slots: Slot[], index: number, step: -1 | 1): number {
  return Math.min(Math.max(index + step, 0), slots.length - 1);
}

/** The first place in the next or previous chapter that has one. */
export function chapterSlot(slots: Slot[], index: number, step: -1 | 1): number {
  const here = slots[index]?.chapterId;
  const chapters = [...new Set(slots.map((slot) => slot.chapterId))];
  const target = chapters[chapters.indexOf(here ?? '') + step];
  if (target === undefined) return index;
  return slots.findIndex((slot) => slot.chapterId === target);
}

function nameOf(map: MapView, id: string): string {
  for (const chapter of map.activities) {
    if (chapter.id === id) return chapter.name;
    for (const task of chapter.tasks) {
      if (task.id === id) return task.name;
      for (const sub of task.subtasks) {
        if (sub.id === id) return sub.name;
        const found = sub.steps.find((each) => each.id === id);
        if (found) return found.name;
      }
    }
  }
  return '';
}

function childCount(map: MapView, id: string): number {
  for (const task of map.activities.flatMap((chapter) => chapter.tasks)) {
    if (task.id === id) return task.subtasks.length;
    const sub = task.subtasks.find((each) => each.id === id);
    if (sub) return sub.steps.length;
  }
  return 0;
}

export interface SlotParts {
  before: string;
  /** The row it lands beside or inside, or the chapter it ends. Set apart in the hint, so names don't run together. */
  name: string | null;
  after: string;
}

/** Where the row would land, split so the hint can set the name apart. */
export function slotParts(map: MapView, id: string, slot: Slot): SlotParts {
  const here = currentDestination(map, id);
  if (here && same(here, slot.to)) return { before: 'Back where it was', name: null, after: '' };
  const { to, hover } = slot;
  if ('chapterId' in to) {
    const chapter = nameOf(map, to.chapterId);
    return to.before === null
      ? { before: 'At the end of ', name: chapter, after: '' }
      : { before: 'Before ', name: nameOf(map, to.before), after: `, in ${chapter}` };
  }
  const parentId = 'parentId' in to ? to.parentId : to.subtaskId;
  const parent = nameOf(map, parentId);
  if (to.before !== null) return { before: 'Before ', name: nameOf(map, to.before), after: `, inside ${parent}` };
  // Its own row doesn't count as a child already there.
  const others = childCount(map, parentId) - (hover.overId === parentId && currentParent(map, id) === parentId ? 1 : 0);
  return { before: 'Inside ', name: parent, after: others > 0 ? ', at the end' : '' };
}

/** Says where the row would land, for a screen reader. */
export function describeSlot(map: MapView, id: string, slot: Slot): string {
  const { before, name, after } = slotParts(map, id, slot);
  return `${before}${name ?? ''}${after}`;
}

function currentParent(map: MapView, id: string): string | null {
  const here = currentDestination(map, id);
  if (here === null || 'chapterId' in here) return null;
  return 'parentId' in here ? here.parentId : here.subtaskId;
}
