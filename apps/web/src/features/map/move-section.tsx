'use client';
import type { MapView } from '@litmus/core';
import { Button } from '../../ui/button';
import { button, SELECT } from '../../ui/control';
import { PopoverPanel, PopoverRoot, PopoverTitle, PopoverTrigger } from '../../ui/popover';
import { SelectChevron } from './select-chevron';
import { moveChoices, stepDestination, type Destination } from './drop';

const STEPS = [
  { label: 'Move up', step: -1, path: 'M8 13V3M3.5 7.5 8 3l4.5 4.5' },
  { label: 'Move down', step: 1, path: 'M8 3v10M3.5 8.5 8 13l4.5-4.5' },
] as const;

/** One step at a time, for keyboard and touch. */
export function MoveArrows({ map, id, onMove }: { map: MapView; id: string; onMove: (to: Destination) => void }) {
  return (
    <div role="group" aria-label="Move" className="flex gap-1 max-lg:flex-2">
      {STEPS.map(({ label, step, path }) => {
        const to = stepDestination(map, id, step);
        return (
          <Button
            key={label}
            aria-label={label}
            title={label}
            aria-disabled={to === null}
            onClick={() => {
              if (to) onMove(to);
            }}
            variant="raised"
            shape="icon"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={path} />
            </svg>
          </Button>
        );
      })}
    </div>
  );
}

/** With the arrows, reaches everything dragging can. */
export function MoveTo({ map, id, onMove }: { map: MapView; id: string; onMove: (to: Destination) => void }) {
  return (
    <span className="relative max-lg:w-full">
      <select
        aria-label="Move to"
        value=""
        onChange={(event) => {
          if (event.target.value !== '') onMove(JSON.parse(event.target.value) as Destination);
        }}
        className={`${SELECT} max-lg:w-full lg:[field-sizing:content]`}
      >
        <option value="">Move to…</option>
        {moveChoices(map, id).map((group) => (
          <optgroup key={group.chapter} label={group.chapter}>
            {group.choices.map((choice) => (
              <option key={choice.label} value={JSON.stringify(choice.to)}>
                {choice.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <SelectChevron />
    </span>
  );
}

/**
 * The drawer's More menu. Dragging is how most people reorder, so the keyboard and touch way in waits behind a
 * button by the close X rather than sitting beside the light.
 */
export function MoveMenu({ map, id, onMove }: { map: MapView; id: string; onMove: (to: Destination) => void }) {
  return (
    <PopoverRoot>
      <PopoverTrigger
        aria-label="More"
        title="More"
        className={`${button({ variant: 'quiet', shape: 'icon' })} -mt-1.5 shrink-0 max-lg:-mt-3.5 max-lg:w-11 max-lg:flex-none`}
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="currentColor">
          <circle cx="3.5" cy="8" r="1.25" />
          <circle cx="8" cy="8" r="1.25" />
          <circle cx="12.5" cy="8" r="1.25" />
        </svg>
      </PopoverTrigger>
      <PopoverPanel align="end" className="flex w-[min(18rem,calc(100vw-2rem))] flex-col gap-3 p-3">
        <PopoverTitle className="px-0.5 pt-1 text-[13px] font-semibold">Move</PopoverTitle>
        <MoveArrows map={map} id={id} onMove={onMove} />
        <MoveTo map={map} id={id} onMove={onMove} />
      </PopoverPanel>
    </PopoverRoot>
  );
}
