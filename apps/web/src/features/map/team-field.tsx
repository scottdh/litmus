'use client';
import type { TeamView } from '@litmus/core';
import { useState } from 'react';
import { SELECT, SelectChevron } from './select-chevron';

/** "No team" on a task, and "Same as its task" on a subtask, which has no other way to have no team. */
const NONE = '';

/**
 * Who turns this task from grey to green. A subtask can have a team of its own, or follow its task's, which can
 * leave its task's light waiting on another team.
 */
export function TeamField({
  teams,
  own,
  following,
  onChange,
}: {
  teams: TeamView[];
  /** Set on this task or subtask. */
  own: string | null;
  /** For a subtask: the team it follows while it has none of its own. */
  following: { teamId: string | null } | null;
  onChange: (teamId: string | null) => Promise<{ ok: boolean }>;
}) {
  const [failed, setFailed] = useState(false);
  // Shows the choice at once, rather than waiting for the map to come back from the server.
  const [shown, setShown] = useState(own);
  const nameOf = (id: string | null) => teams.find((team) => team.id === id)?.name ?? 'No team';
  const none = following === null ? 'No team' : `Same as its task (${nameOf(following.teamId)})`;

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex w-full items-center justify-between gap-3">
        <label htmlFor="drawer-team" className="text-[13px] text-muted">
          Team
        </label>
        <span className="relative">
          <select
            id="drawer-team"
            value={shown ?? NONE}
            onChange={(event) => {
              const next = event.target.value === NONE ? null : event.target.value;
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
            className={SELECT}
          >
            <option value={NONE}>{none}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <SelectChevron />
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
