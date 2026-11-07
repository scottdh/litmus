'use client';
import { useRef } from 'react';
import { PopoverClose, PopoverPanel, PopoverRoot, PopoverTitle, PopoverTrigger } from '../../ui/popover';
import { BUTTON } from './button-style';
import { removeTeamWarning } from './teams';

/** Asks on the button itself, so the question sits where the click was. Focus starts on Cancel. */
export function RemoveTeam({
  name,
  taskCount,
  removing,
  onRemove,
}: {
  name: string;
  taskCount: number;
  removing: boolean;
  onRemove: () => void;
}) {
  const cancel = useRef<HTMLButtonElement>(null);
  return (
    <PopoverRoot>
      <PopoverTrigger className={`${BUTTON} text-danger shadow-raised`}>Remove team</PopoverTrigger>
      <PopoverPanel align="start" initialFocus={cancel} className="w-[min(18rem,calc(100vw-2rem))] p-3">
        <PopoverTitle className="text-[14px] leading-snug font-semibold text-pretty">Remove {name}?</PopoverTitle>
        <p className="mt-1 text-[13px] leading-snug text-pretty text-muted">{removeTeamWarning(taskCount)}</p>
        <div className="mt-3 flex justify-end gap-2">
          <PopoverClose ref={cancel} className={`${BUTTON} shadow-raised`}>
            Cancel
          </PopoverClose>
          <button
            type="button"
            onClick={onRemove}
            aria-disabled={removing}
            className={`${BUTTON} bg-danger text-surface aria-disabled:cursor-default aria-disabled:opacity-60`}
          >
            Remove team
          </button>
        </div>
      </PopoverPanel>
    </PopoverRoot>
  );
}
