'use client';
import type { MapView } from '@litmus/core';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { Destination } from './drop';
import { chapterSlot, describeSlot, keyboardSlots, nextSlot, startSlot, type Shown, type Slot } from './keyboard-move';
import { indicatorFor, type DropIndicator } from './use-task-drag';

interface Carrying {
  id: string;
  name: string;
  slots: Slot[];
  start: number;
  index: number;
}

const rowFor = (id: string) =>
  document.querySelector<HTMLElement>(
    `[data-drop-step="${id}"], [data-drop-task="${id}"], [data-drop-chapter="${id}"]`,
  );

/** The row may have moved to a list that's still opening, so focus follows it there once it can take it. */
function followRow(id: string, frames = 30) {
  const row = document.getElementById(`open-${id}`);
  row?.focus();
  if (document.activeElement !== row && frames > 0) {
    requestAnimationFrame(() => {
      followRow(id, frames - 1);
    });
  }
}

/**
 * Space on a row picks it up, the arrow keys carry it through the places dragging could drop it, Enter drops it and
 * Esc puts it back. Keys are caught on the window while carrying, so nothing else on the page reacts to them.
 */
export function useKeyboardMove(map: MapView, shown: Shown, onDrop: (id: string, to: Destination) => Promise<unknown>) {
  const [carrying, setCarrying] = useState<Carrying | null>(null);
  const [indicator, setIndicator] = useState<DropIndicator | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const latest = useRef({ map, shown, onDrop });
  useEffect(() => {
    latest.current = { map, shown, onDrop };
  });

  const pickUp = useCallback((id: string, name: string, event: ReactKeyboardEvent) => {
    if (event.key !== ' ' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    const { map: now, shown: visible } = latest.current;
    const slots = keyboardSlots(now, id, visible);
    if (slots.length === 0) return;
    const start = startSlot(now, id, slots);
    // Space would open the drawer on release, but here it picked the row up.
    window.addEventListener(
      'keyup',
      (up) => {
        if (up.key === ' ') up.preventDefault();
      },
      { capture: true, once: true },
    );
    setCarrying({ id, name, slots, start, index: start });
    setAnnouncement(`Picked up ${name}. Use the arrow keys to move it, Enter to drop it, or Escape to put it back.`);
  }, []);

  useEffect(() => {
    if (carrying === null) return;
    const { id, name, slots, start, index } = carrying;
    const slot = slots[index];

    const place = () => {
      const row = slot ? rowFor(slot.hover.overId) : null;
      setIndicator(row && slot ? indicatorFor(slot.hover, row.getBoundingClientRect()) : null);
    };
    if (slot) rowFor(slot.hover.overId)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    place();

    const putBack = () => {
      setCarrying(null);
      setAnnouncement(`${name} is back where it was.`);
    };
    const moveTo = (next: number) => {
      const target = slots[next];
      if (next === index || !target) return;
      setCarrying({ ...carrying, index: next });
      setAnnouncement(describeSlot(latest.current.map, id, target));
    };

    const onKey = (key: KeyboardEvent) => {
      const handled = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape'].includes(key.key);
      if (key.key === 'Tab') putBack();
      if (!handled) return;
      key.preventDefault();
      key.stopPropagation();
      if (key.repeat && (key.key === 'Enter' || key.key === ' ')) return;
      if (key.key === 'ArrowUp') moveTo(nextSlot(slots, index, -1));
      else if (key.key === 'ArrowDown') moveTo(nextSlot(slots, index, 1));
      else if (key.key === 'ArrowLeft') moveTo(chapterSlot(slots, index, -1));
      else if (key.key === 'ArrowRight') moveTo(chapterSlot(slots, index, 1));
      else if (key.key === 'Escape' || index === start || !slot) putBack();
      else {
        setCarrying(null);
        setAnnouncement('');
        void latest.current.onDrop(id, slot.to).then(() => {
          followRow(id);
        });
      }
    };
    // Space's release would open the drawer of whatever has focus.
    const onKeyUp = (up: KeyboardEvent) => {
      if (up.key === ' ') up.preventDefault();
    };

    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('pointerdown', putBack, true);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('pointerdown', putBack, true);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      setIndicator(null);
    };
  }, [carrying]);

  const where = carrying?.slots[carrying.index];
  const line =
    carrying === null || where === undefined
      ? null
      : carrying.index === carrying.start
        ? 'Where it is now'
        : describeSlot(map, carrying.id, where);

  return { pickUp, carrying: carrying && { id: carrying.id, name: carrying.name, line }, indicator, announcement };
}
