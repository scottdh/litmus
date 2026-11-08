'use client';
import { LIGHTS, type Light } from '@litmus/core';
import type { Ref } from 'react';
import { PopoverPanel, PopoverRoot, PopoverTitle, PopoverTrigger } from '../../ui/popover';
import { BUTTON, RAISED } from './button-style';
import { LightMark } from './light-mark';
import { FILL_COLOUR, LIGHT_COPY } from './lights';

const GREEN_RULE =
  'Green means deployed to a real environment and completable end to end with realistic data. Mocks don’t count.';

/** What the lights mean, kept a click away because people learn them quickly. Its rows also dim the map. */
export function KeyPopover({
  dim,
  onDim,
  isSample,
  triggerRef,
}: {
  dim: Light | null;
  onDim: (light: Light | null) => void;
  isSample: boolean;
  triggerRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <PopoverRoot>
      <PopoverTrigger ref={triggerRef} className={`${BUTTON} ${RAISED} flex shrink-0 items-center gap-1.5`}>
        <span aria-hidden="true" className="flex -space-x-1">
          <LightMark light="green" className="size-3 text-mark-green" />
          <LightMark light="yellow" className="size-3 text-mark-yellow" />
          <LightMark light="red" className="size-3 text-mark-red" />
        </span>
        Key
      </PopoverTrigger>
      <PopoverPanel align="end" className="w-[min(22rem,calc(100vw-2rem))] p-3">
        <PopoverTitle className="px-1.5 pt-1 text-[13px] font-semibold">What the lights mean</PopoverTitle>
        <ul aria-label="Dim the map to one light" className="mt-2 flex flex-col gap-0.5">
          {LIGHTS.map((light) => (
            <li key={light}>
              <button
                type="button"
                aria-pressed={dim === light}
                onClick={() => {
                  onDim(dim === light ? null : light);
                }}
                className="grid min-h-11 w-full cursor-pointer grid-cols-[6.75rem_1fr] items-start gap-3 rounded-sm px-1.5 py-2.5 text-start transition-colors duration-150 ease-out hover:bg-canvas aria-pressed:bg-canvas"
              >
                <span
                  className={`flex h-6 w-fit items-center gap-1.5 rounded-sm px-1.5 text-[12px] font-medium ${FILL_COLOUR[light]}`}
                >
                  <LightMark light={light} className="size-3" />
                  {LIGHT_COPY[light].label}
                </span>
                <span className="pt-0.5 text-[13px] leading-snug text-pretty text-muted">
                  {LIGHT_COPY[light].meaning}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mx-1.5 mt-3 border-t-(length:--hairline) border-line pt-3 text-[13px] leading-snug text-pretty">
          {GREEN_RULE}
        </p>
        <p className="mx-1.5 mt-2 text-[12px] leading-snug text-muted">Pick a light to dim the rest of the map.</p>
        {isSample && (
          <p className="mx-1.5 mt-3 mb-1 rounded-sm bg-light-grey px-2 py-1.5 text-[12px] leading-snug text-on-light-grey">
            Sample data: an invented bike workshop. These ratings aren’t real, and changes last until the server
            restarts.
          </p>
        )}
      </PopoverPanel>
    </PopoverRoot>
  );
}
