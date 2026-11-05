'use client';
import { useEffect, useState } from 'react';
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

export function useChapterFocus(mapId: string, chapterIds: string[]) {
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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFocus([]);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return {
    focus,
    animate,
    toggle: (id: string) => {
      setFocus((current) => toggleFocus(current, id));
    },
    clear: () => {
      setFocus([]);
    },
  };
}
