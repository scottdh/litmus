'use client';
import type { TeamView } from '@litmus/core';
import { useState } from 'react';

const NO_TEAM = '';

/** Who turns this task from grey to green. A subtask shows its task's team without letting it change here. */
export function TeamField({
  teams,
  teamId,
  inherited,
  onChange,
}: {
  teams: TeamView[];
  teamId: string | null;
  inherited: boolean;
  onChange: (teamId: string | null) => Promise<{ ok: boolean }>;
}) {
  const [failed, setFailed] = useState(false);
  // Shows the choice at once, rather than waiting for the map to come back from the server.
  const [shown, setShown] = useState(teamId);
  const name = teams.find((team) => team.id === teamId)?.name ?? 'No team';

  if (inherited) {
    return (
      <div className="flex w-full items-baseline justify-between gap-3 text-[14px] leading-snug">
        <span className="text-[13px] text-muted">Team</span>
        <span className="text-right">
          {name}
          <span className="block text-[13px] text-muted">Set on its task</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex w-full items-center justify-between gap-3">
        <label htmlFor="drawer-team" className="text-[13px] text-muted">
          Team
        </label>
        <span className="relative">
          <select
            id="drawer-team"
            value={shown ?? NO_TEAM}
            onChange={(event) => {
              const next = event.target.value === NO_TEAM ? null : event.target.value;
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
            }}
            className="h-8 cursor-pointer appearance-none rounded-sm bg-surface ps-2 pe-7 text-base font-medium shadow-raised max-lg:h-11 lg:text-[13px]"
          >
            <option value={NO_TEAM}>No team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 12 12"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-muted"
          >
            <path
              d="M2.5 4.5 6 8l3.5-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      {failed && (
        <p role="alert" className="text-[13px] text-pretty text-muted">
          That team couldn’t be saved, so it hasn’t changed.
        </p>
      )}
    </div>
  );
}
