'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { LINE_FIELD } from '../../ui/control';

const isBlank = (text: string) => text.trim() === '';

/**
 * A one-line name that wraps as it grows.
 * Enter saves and finishes, Esc puts back the name it started with, and leaving saves unless it's empty.
 */
export function NameField({
  value,
  label,
  selectOnFocus,
  className = '',
  onDraft,
  onSave,
  onFinish,
}: {
  value: string;
  label: string;
  selectOnFocus: boolean;
  className?: string;
  /** Every keystroke, so the map can follow what's typed. */
  onDraft: (name: string) => void;
  /** Called with a name that isn't empty, and only if it changed. */
  onSave: (name: string) => void;
  onFinish: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const [blankAttempt, setBlankAttempt] = useState(false);
  const started = useRef(value);
  const leaving = useRef(false);
  const field = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const element = field.current;
    // On a touch screen focus would raise the keyboard over the drawer, so the name waits for a tap.
    if (!element || window.matchMedia('(pointer: coarse)').matches) return;
    element.focus({ preventScroll: true });
    if (selectOnFocus) element.select();
    else element.setSelectionRange(element.value.length, element.value.length);
  }, [selectOnFocus]);

  useLayoutEffect(() => {
    const element = field.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${String(element.scrollHeight)}px`;
  }, [draft]);

  const save = () => {
    if (!isBlank(draft) && draft !== started.current) onSave(draft);
  };

  return (
    <>
      <textarea
        ref={field}
        rows={1}
        value={draft}
        aria-label={label}
        aria-invalid={blankAttempt}
        aria-describedby={blankAttempt ? 'name-field-error' : undefined}
        className={`${LINE_FIELD} ${className}`}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          setBlankAttempt(false);
          onDraft(isBlank(next) ? started.current : next);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            leaving.current = true;
            onDraft(started.current);
            onFinish();
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            if (isBlank(draft)) {
              setBlankAttempt(true);
              return;
            }
            leaving.current = true;
            save();
            onFinish();
          }
        }}
        onBlur={() => {
          if (leaving.current) return;
          if (isBlank(draft)) {
            setDraft(started.current);
            setBlankAttempt(false);
            onDraft(started.current);
            return;
          }
          save();
          started.current = draft;
        }}
      />
      {blankAttempt && (
        <p id="name-field-error" role="alert" className="mt-2 font-sans text-[13px] leading-snug tracking-normal">
          A name can’t be empty. Leave this field to keep the old one.
        </p>
      )}
    </>
  );
}
