'use client';
import { useRef } from 'react';
import { PopoverClose, PopoverPanel, PopoverRoot, PopoverTitle, PopoverTrigger } from '../../ui/popover';
import { BUTTON, RAISED } from './button-style';

/**
 * The confirm for a change that loses data: it asks on the button itself, so the question sits where the click was.
 * Focus starts on Cancel. Undo still follows, so the warning says so.
 */
export function RemoveConfirm({
  label,
  name,
  warning,
  removing,
  onRemove,
}: {
  label: string;
  name: string;
  warning: string;
  removing: boolean;
  onRemove: () => void;
}) {
  const cancel = useRef<HTMLButtonElement>(null);
  return (
    <PopoverRoot>
      <PopoverTrigger className={`${BUTTON} ${RAISED} text-danger`}>{label}</PopoverTrigger>
      <PopoverPanel align="start" initialFocus={cancel} className="w-[min(18rem,calc(100vw-2rem))] p-3">
        <PopoverTitle className="text-[14px] leading-snug font-semibold text-pretty">Remove {name}?</PopoverTitle>
        <p className="mt-1 text-[13px] leading-snug text-pretty text-muted">{warning}</p>
        <div className="mt-3 flex justify-end gap-2">
          <PopoverClose ref={cancel} className={`${BUTTON} ${RAISED}`}>
            Cancel
          </PopoverClose>
          <button
            type="button"
            onClick={onRemove}
            aria-disabled={removing}
            className={`${BUTTON} bg-danger text-surface aria-disabled:cursor-default aria-disabled:opacity-60`}
          >
            {label}
          </button>
        </div>
      </PopoverPanel>
    </PopoverRoot>
  );
}
