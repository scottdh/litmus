'use client';
import { useEffect, useState } from 'react';
import { isInPopover } from '../../ui/popover';
import { restoreFocus, toggleFocus } from './focus';

function read(key: string, chapterIds: string[]) {
  try {
    return restoreFocus(localStorage.getItem(key), chapterIds);
  } catch {
    return [];
  }
}

function write(key: string, focus: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(focus));
  } catch {
    // Blocked storage only means the choice isn't remembered.
  }
}

/** `escapeClears` is off while something else, like the drawer, owns Esc. */
export function useChapterFocus(mapId: string, chapterIds: string[], escapeClears: boolean) {
  const key = `litmus:focus:${mapId}`;
  const [focus, setFocus] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Motion starts after first paint, so a remembered focus doesn't animate on load.
  const [animate, setAnimate] = useState(false);
  const idList = chapterIds.join(' ');

  useEffect(() => {
    setFocus(read(key, idList.split(' ')));
    setLoaded(true);
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        setAnimate(true);
      });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [key, idList]);

  useEffect(() => {
    if (loaded) write(key, focus);
  }, [key, focus, loaded]);

  useEffect(() => {
    if (!escapeClears) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !isInPopover(event)) setFocus([]);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [escapeClears]);

  return {
    focus,
    /** The remembered focus has been read, so what's folded is settled. */
    loaded,
    animate,
    toggle: (id: string) => {
      setFocus((current) => toggleFocus(current, id));
    },
    clear: () => {
      setFocus([]);
    },
    set: setFocus,
  };
}
