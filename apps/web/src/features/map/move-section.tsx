'use client';
import type { MapView } from '@litmus/core';
import { BUTTON } from './button-style';
import { moveChoices, stepDestination, type Destination } from './drop';

/** Reaches everything dragging can, for keyboard and touch. */
export function MoveSection({ map, id, onMove }: { map: MapView; id: string; onMove: (to: Destination) => void }) {
  const up = stepDestination(map, id, -1);
  const down = stepDestination(map, id, 1);
  return (
    <section aria-label="Move" className="flex w-full flex-wrap items-center gap-2">
      <button
        type="button"
        aria-disabled={up === null}
        onClick={() => {
          if (up) onMove(up);
        }}
        className={`${BUTTON} shadow-raised aria-disabled:cursor-not-allowed aria-disabled:text-muted`}
      >
        Move up
      </button>
      <button
        type="button"
        aria-disabled={down === null}
        onClick={() => {
          if (down) onMove(down);
        }}
        className={`${BUTTON} shadow-raised aria-disabled:cursor-not-allowed aria-disabled:text-muted`}
      >
        Move down
      </button>
      <select
        aria-label="Move to"
        value=""
        onChange={(event) => {
          if (event.target.value !== '') onMove(JSON.parse(event.target.value) as Destination);
        }}
        className="h-8 min-w-0 grow cursor-pointer rounded-sm bg-surface px-1 text-base shadow-raised lg:text-[13px]"
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
    </section>
  );
}
