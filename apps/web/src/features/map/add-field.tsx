'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '../../ui/button';
import { LINE_FIELD, type Variant } from '../../ui/control';

/**
 * A name that doesn't exist yet. Enter adds it, Esc gives up, and leaving adds anything typed.
 * With `keepGoing`, Enter clears the field for the next one, and Enter on an empty field finishes.
 */
export function AddField({
  label,
  placeholder,
  keepGoing,
  className = '',
  describedBy,
  onDraft,
  onAdd,
  onFinish,
}: {
  label: string;
  placeholder: string;
  keepGoing: boolean;
  className?: string;
  describedBy?: string | undefined;
  /** Every keystroke, for a note that reacts to what's typed. */
  onDraft?: (text: string) => void;
  onAdd: (name: string) => void;
  /** `byKey` means the person is still here, so focus needs somewhere to land. */
  onFinish: (byKey: boolean) => void;
}) {
  const [draft, setDraft] = useState('');
  const leaving = useRef(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const hasName = draft.trim() !== '';

  useLayoutEffect(() => {
    field.current?.focus({ preventScroll: true });
    field.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, []);

  useLayoutEffect(() => {
    const element = field.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${String(element.scrollHeight)}px`;
  }, [draft]);

  return (
    <textarea
      ref={field}
      rows={1}
      value={draft}
      aria-label={label}
      aria-describedby={describedBy}
      enterKeyHint={keepGoing ? 'next' : 'done'}
      placeholder={placeholder}
      className={`${LINE_FIELD} scroll-mx-6 ${className}`}
      onChange={(event) => {
        setDraft(event.target.value);
        onDraft?.(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          // Only this field ends, not the drawer or focus around it.
          event.preventDefault();
          leaving.current = true;
          onFinish(true);
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          if (hasName) onAdd(draft);
          if (hasName && keepGoing) {
            setDraft('');
            onDraft?.('');
            return;
          }
          leaving.current = true;
          onFinish(true);
        }
      }}
      onBlur={() => {
        if (leaving.current) return;
        if (hasName) onAdd(draft);
        onFinish(false);
      }}
    />
  );
}

/** A button that becomes an AddField, and takes focus back when that's done by key. */
export function AddControl({
  action,
  label,
  placeholder,
  startOpen = false,
  variant,
  buttonClassName = '',
  fieldClassName = '',
  onAdd,
}: {
  action: string;
  label: string;
  placeholder: string;
  startOpen?: boolean;
  variant: Variant;
  /** Layout only; the variant carries the colour and hover. */
  buttonClassName?: string;
  fieldClassName?: string;
  onAdd: (name: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);

  useEffect(() => {
    if (startOpen) setAdding(true);
  }, [startOpen]);

  useLayoutEffect(() => {
    if (!adding && refocus.current) trigger.current?.focus();
    refocus.current = false;
  }, [adding]);

  if (adding) {
    return (
      <AddField
        keepGoing
        label={label}
        placeholder={placeholder}
        className={fieldClassName}
        onAdd={onAdd}
        onFinish={(byKey) => {
          refocus.current = byKey;
          setAdding(false);
        }}
      />
    );
  }
  return (
    <Button
      ref={trigger}
      onClick={() => {
        setAdding(true);
      }}
      variant={variant}
      className={buttonClassName}
    >
      {action}
    </Button>
  );
}
