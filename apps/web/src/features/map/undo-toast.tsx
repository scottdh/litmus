'use client';
import { useEffect, useState } from 'react';
import { BUTTON } from './button-style';

const SHOW_FOR = 8000;

/**
 * Puts Undo where the eye already is after a change. Neutral, never green, because green is a light on this map.
 * The status line already announces the change, so this isn't a live region.
 */
export function UndoToast({
  token,
  text,
  onUndo,
  besideDrawer,
}: {
  token: string | null;
  text: string;
  onUndo: () => void;
  besideDrawer: boolean;
}) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (token === null || held) return;
    const timer = window.setTimeout(() => {
      setDismissed(token);
    }, SHOW_FOR);
    return () => {
      window.clearTimeout(timer);
    };
  }, [token, held]);

  if (token === null || dismissed === token) return null;
  const dismiss = () => {
    setDismissed(token);
    setHeld(false);
  };
  return (
    <div
      // Keyed, so the next change's toast enters afresh and gets its own 8 s.
      key={token}
      onPointerEnter={() => {
        setHeld(true);
      }}
      onPointerLeave={() => {
        setHeld(false);
      }}
      onFocus={() => {
        setHeld(true);
      }}
      onBlur={() => {
        setHeld(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          dismiss();
        }
      }}
      className={`fixed inset-x-4 bottom-6 z-20 mx-auto flex w-fit max-w-xl items-center gap-3 rounded-md bg-ink py-1.5 ps-4 pe-1.5 text-surface shadow-raised [transition:opacity_200ms_var(--ease-out-strong),translate_200ms_var(--ease-out-strong)] starting:translate-y-2 starting:opacity-0 motion-reduce:starting:translate-y-0 ${besideDrawer ? 'lg:right-100' : ''}`}
    >
      <span className="text-[14px] leading-snug text-pretty">{text}</span>
      <button
        type="button"
        onClick={() => {
          dismiss();
          onUndo();
        }}
        className={`${BUTTON} shrink-0 font-semibold text-surface underline decoration-surface/40 underline-offset-2 transition-[text-decoration-color,scale] hover:decoration-surface`}
      >
        Undo
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="relative grid size-8 shrink-0 cursor-pointer place-items-center rounded-sm text-surface/60 transition-[color,scale] duration-150 ease-out before:absolute before:-inset-1.5 hover:text-surface active:scale-[0.96]"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
        </svg>
      </button>
    </div>
  );
}
