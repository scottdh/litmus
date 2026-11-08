'use client';
import type { MapView } from '@litmus/core';
import { Button } from '../../ui/button';
import { SELECT } from '../../ui/control';
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
