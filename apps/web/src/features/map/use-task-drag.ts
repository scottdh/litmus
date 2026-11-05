'use client';
import type { MapView } from '@litmus/core';
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { canHoldSubtasks, destinationFor, hasSubtasks, zoneFor, type Destination, type Hover } from './drop';

export interface DropIndicator {
  kind: 'line' | 'box';
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Dragging {
  id: string;
  name: string;
}

const THRESHOLD = 5;
const EDGE = 48;
const SCROLL_STEP = 12;

function readHover(map: MapView, draggedId: string, x: number, y: number) {
  const element = document.elementFromPoint(x, y);
  const row = element?.closest<HTMLElement>('[data-drop-task]');
  if (row?.dataset.dropTask) {
    const overId = row.dataset.dropTask;
    const rect = row.getBoundingClientRect();
    const canNest = overId !== draggedId && canHoldSubtasks(map, overId) && !hasSubtasks(map, draggedId);
    const hover: Hover = { overId, zone: zoneFor((y - rect.top) / rect.height, canNest) };
    return { hover, rect };
  }
  const chapter = element?.closest<HTMLElement>('[data-drop-chapter]');
  if (chapter?.dataset.dropChapter) {
    const hover: Hover = { overId: chapter.dataset.dropChapter, zone: 'end' };
    return { hover, rect: chapter.getBoundingClientRect() };
  }
  return null;
}

function indicatorFor(hover: Hover, rect: DOMRect): DropIndicator {
  if (hover.zone === 'inside' || hover.zone === 'end') {
    return { kind: 'box', left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  }
  const top = hover.zone === 'before' ? rect.top : rect.bottom;
  return { kind: 'line', left: rect.left, top, width: rect.width, height: 2 };
}

/** Mouse and pen only. Touch uses the drawer's Move to, because dragging would fight with scrolling. */
export function useTaskDrag(map: MapView, onDrop: (id: string, to: Destination) => void) {
  const [dragging, setDragging] = useState<Dragging | null>(null);
  const [indicator, setIndicator] = useState<DropIndicator | null>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const latest = useRef({ map, onDrop });
  useEffect(() => {
    latest.current = { map, onDrop };
  });

  const start = useCallback((id: string, name: string, down: ReactPointerEvent) => {
    if (down.button !== 0 || down.pointerType === 'touch') return;
    const startX = down.clientX;
    const startY = down.clientY;
    let active = false;
    let destination: Destination | null = null;
    let scrollBy = 0;
    let frame = 0;

    const scroller = document.querySelector<HTMLElement>('[role="region"]');
    const scroll = () => {
      if (scroller && scrollBy !== 0) scroller.scrollLeft += scrollBy;
      frame = requestAnimationFrame(scroll);
    };

    const end = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey, true);
      cancelAnimationFrame(frame);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      setDragging(null);
      setIndicator(null);
    };

    const onMove = (move: PointerEvent) => {
      if (!active) {
        if (Math.hypot(move.clientX - startX, move.clientY - startY) < THRESHOLD) return;
        active = true;
        document.body.style.userSelect = 'none';
        setDragging({ id, name });
        frame = requestAnimationFrame(scroll);
      }
      if (ghost.current)
        ghost.current.style.transform = `translate(${String(move.clientX + 12)}px, ${String(move.clientY + 12)}px)`;

      const bounds = scroller?.getBoundingClientRect();
      if (bounds && move.clientX < bounds.left + EDGE) scrollBy = -SCROLL_STEP;
      else if (bounds && move.clientX > bounds.right - EDGE) scrollBy = SCROLL_STEP;
      else scrollBy = 0;

      const found = readHover(latest.current.map, id, move.clientX, move.clientY);
      destination = found && destinationFor(latest.current.map, id, found.hover);
      setIndicator(found && destination ? indicatorFor(found.hover, found.rect) : null);
      document.body.style.cursor = destination ? 'grabbing' : 'not-allowed';
    };

    const onUp = () => {
      const landed = active ? destination : null;
      if (active) {
        // The click that follows a drag isn't a request to open the drawer.
        window.addEventListener(
          'click',
          (click) => {
            click.stopPropagation();
            click.preventDefault();
          },
          { capture: true, once: true },
        );
      }
      end();
      if (landed) latest.current.onDrop(id, landed);
    };

    const onKey = (key: KeyboardEvent) => {
      if (key.key !== 'Escape') return;
      key.preventDefault();
      key.stopPropagation();
      end();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('keydown', onKey, true);
  }, []);

  return { start, dragging, indicator, ghost };
}
