'use client';
import type { TeamView } from '@litmus/core';
import { useState, type KeyboardEvent } from 'react';
import { PopoverPanel, PopoverRoot, PopoverTitle, PopoverTrigger } from '../../ui/popover';
import { teamChoices, teamLine, type Following } from './teams';

/** Two heads, drawn like the persona glyphs, so the team line doesn't read as one more persona. */
export function TeamMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="me-1 inline size-3.5 -translate-y-px"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <circle cx="6" cy="5.5" r="2.25" />
      <path d="M2 13c.5-2.2 2-3.4 4-3.4s3.5 1.2 4 3.4" />
      <path d="M10.5 3.6a2.2 2.2 0 0 1 0 4M12 9.9c1.2.5 1.9 1.6 2.1 3.1" />
    </svg>
  );
}

const STEP: Record<string, (at: number, last: number) => number> = {
  ArrowDown: (at) => at + 1,
  ArrowRight: (at) => at + 1,
  ArrowUp: (at) => at - 1,
  ArrowLeft: (at) => at - 1,
  Home: () => 0,
  End: (_, last) => last,
};

/** Arrows move round the radio group, wrapping, as a native one does. Tab stops only on the ticked team. */
const moveFocus = (event: KeyboardEvent<HTMLDivElement>) => {
  const step = STEP[event.key];
  if (step === undefined) return;
  const radios = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
  const at = radios.findIndex((radio) => radio === document.activeElement);
  event.preventDefault();
  radios[(step(at, radios.length - 1) + radios.length) % radios.length]?.focus();
};

/**
 * Who turns this task from grey to green, as a line under its personas. Teams change about once a year, so it reads
 * as a fact rather than a field. It opens a pick-one list that saves and closes on a pick. A subtask with no team of
 * its own follows its task's, said in `muted` like personas set further down.
 */
export function TeamLine({
  teams,
  own,
  following,
  onChange,
  className = '-mt-2',
}: {
  teams: TeamView[];
  /** Set on this task or subtask. */
  own: string | null;
  following: Following;
  onChange: (teamId: string | null) => Promise<{ ok: boolean }>;
  /** Pulls it up under the name: `-mt-2` as the persona byline sits, or `-mt-3` when it follows that byline. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  // Shows the choice at once, rather than waiting for the map to come back from the server.
  const [shown, setShown] = useState(own);
  const line = teamLine(teams, shown, following);

  const pick = (next: string | null) => {
    setOpen(false);
    if (next === shown) return;
    const before = shown;
    const undo = () => {
      setShown(before);
      setFailed(true);
    };
    setFailed(false);
    setShown(next);
    void onChange(next).then((result) => {
      if (!result.ok) undo();
    }, undo);
  };

  return (
    <div className={`${className} flex w-full flex-col items-start gap-1`}>
      <PopoverRoot open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="-mx-1.5 min-w-0 self-stretch cursor-pointer rounded-sm px-1.5 py-1 text-start text-[13px] leading-relaxed text-pretty text-muted transition-colors duration-150 ease-out hover:bg-canvas max-lg:min-h-11">
          {line.name === null && !line.followed ? (
            <span className="inline-flex items-center gap-1.5">
              <svg
                viewBox="0 0 12 12"
                aria-hidden="true"
                className="size-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M6 2.5v7M2.5 6h7" />
              </svg>
              Add a team
            </span>
          ) : (
            <span className="block">
              <span className="sr-only">Team: </span>
              <TeamMark />
              <span className={line.followed ? undefined : 'text-ink'}>
                {line.name ?? 'No team'}
                {line.followed && ', same as its task'}
              </span>
            </span>
          )}
        </PopoverTrigger>
        <PopoverPanel align="start" className="w-[min(18rem,calc(100vw-2rem))] p-3">
          <PopoverTitle className="px-1.5 pt-1 pb-1 text-[13px] font-semibold">Team</PopoverTitle>
          <div role="radiogroup" aria-label="Team" className="flex flex-col" onKeyDown={moveFocus}>
            {teamChoices(teams, following).map((choice) => {
              const on = shown === choice.id;
              return (
                <button
                  key={choice.id ?? 'none'}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => {
                    pick(choice.id);
                  }}
                  className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-sm px-1.5 py-1.5 text-start text-[14px] transition-colors duration-150 ease-out hover:bg-canvas"
                >
                  <span
                    aria-hidden="true"
                    className={`grid size-4 shrink-0 place-items-center rounded-full shadow-raised transition-colors duration-150 ease-out ${on ? 'bg-ink text-canvas' : 'bg-surface'}`}
                  >
                    {on && <span className="size-1.5 rounded-full bg-current" />}
                  </span>
                  <span className="flex min-w-0 grow flex-col">
                    <span className={choice.id === null ? 'text-muted' : undefined}>{choice.name}</span>
                    {choice.note !== undefined && (
                      <span className="truncate text-[12px] text-muted">{choice.note}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </PopoverPanel>
      </PopoverRoot>
      {failed && (
        <p role="alert" className="text-[13px] leading-snug text-pretty">
          That team couldn’t be saved, so it hasn’t changed.
        </p>
      )}
    </div>
  );
}
