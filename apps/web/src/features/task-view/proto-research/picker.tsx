'use client';
// PROTOTYPE (#104). Throwaway. The picker spec from emil-prototype, verbatim.
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

// eslint-disable-next-line no-restricted-syntax -- the picker is harness chrome with a fixed spec, not part of the design
const CSS = `
.proto-picker { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 2147483647; display: flex; align-items: center; gap: 2px; padding: 4px; border-radius: 999px; background: rgba(10, 10, 10, 0.82); -webkit-backdrop-filter: blur(12px) saturate(1.4); backdrop-filter: blur(12px) saturate(1.4); box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 8px 24px rgba(0, 0, 0, 0.24), 0 2px 6px rgba(0, 0, 0, 0.12); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 13px; line-height: 1; -webkit-font-smoothing: antialiased; user-select: none; -webkit-user-select: none; }
.proto-picker-highlight { position: absolute; top: 4px; left: 0; height: 28px; border-radius: 999px; background: rgba(255, 255, 255, 0.12); will-change: transform; }
.proto-picker[data-ready] .proto-picker-highlight { transition: transform 250ms cubic-bezier(0.23, 1, 0.32, 1), width 250ms cubic-bezier(0.23, 1, 0.32, 1); }
@media (prefers-reduced-motion: reduce) { .proto-picker[data-ready] .proto-picker-highlight { transition: none; } }
.proto-picker-item { position: relative; display: flex; align-items: center; height: 28px; padding: 0 12px; border: 0; border-radius: 999px; background: transparent; color: rgba(255, 255, 255, 0.55); font: inherit; cursor: pointer; transition: color 150ms ease-out; }
.proto-picker-item:hover { color: rgba(255, 255, 255, 0.85); }
.proto-picker-item:active { transform: scale(0.97); }
.proto-picker-item:focus-visible { outline: 2px solid rgba(255, 255, 255, 0.4); outline-offset: 2px; }
.proto-picker-item[data-active] { color: #fff; }
.proto-picker[data-position="top"] { bottom: auto; top: 24px; }
`;

export const VARIANTS = ['In place', 'Edit mode', 'Quote first'] as const;

const listeners = new Set<() => void>();
const read = () => {
  const v = Number(new URLSearchParams(window.location.search).get('v'));
  return v >= 1 && v <= VARIANTS.length ? v - 1 : 0;
};
const write = (i: number) => {
  const url = new URL(window.location.href);
  url.searchParams.set('v', String(i + 1));
  window.history.replaceState(window.history.state, '', url);
  listeners.forEach((l) => {
    l();
  });
};

export function useVariant() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => 0,
  );
}

export function Picker() {
  const current = useVariant();
  const nav = useRef<HTMLElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const move = () => {
      const el = nav.current?.querySelectorAll<HTMLButtonElement>('.proto-picker-item')[current];
      if (!el || !highlight.current) return;
      highlight.current.style.width = `${String(el.offsetWidth)}px`;
      highlight.current.style.transform = `translateX(${String(el.offsetLeft)}px)`;
    };
    move();
    window.addEventListener('resize', move);
    return () => {
      window.removeEventListener('resize', move);
    };
  }, [current]);

  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setReady(true);
      }),
    );
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement) {
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
        if (t.closest('[role="tablist"], [role="radiogroup"], [data-popover]')) return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      const at = read();
      if (n >= 1 && n <= VARIANTS.length) write(n - 1);
      else if (e.key === 'ArrowRight') write((at + 1) % VARIANTS.length);
      else if (e.key === 'ArrowLeft') write((at - 1 + VARIANTS.length) % VARIANTS.length);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <nav
        ref={nav}
        className="proto-picker"
        data-position="top"
        aria-label="Prototype variants"
        data-ready={ready ? '' : undefined}
      >
        <span ref={highlight} className="proto-picker-highlight" aria-hidden="true" />
        {VARIANTS.map((name, i) => (
          <button
            key={name}
            type="button"
            className="proto-picker-item"
            data-active={i === current ? '' : undefined}
            aria-current={i === current ? 'true' : undefined}
            onClick={() => {
              write(i);
            }}
          >
            {name}
          </button>
        ))}
      </nav>
    </>
  );
}
