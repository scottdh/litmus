'use client';
import type { ActivityView, TeamView } from '@litmus/core';
import { useState, type ReactNode, type Ref } from 'react';
import { PopoverPanel, PopoverRoot, PopoverTitle, PopoverTrigger } from '../../ui/popover';
import { AddControl } from './add-field';
import { BUTTON } from './button-style';
import { NO_TEAM } from './teams';

const taskCount = (count: number) => `${String(count)} ${count === 1 ? 'task' : 'tasks'}`;

/** A checkbox row in a popover that picks whose tasks to show, with its task count. */
export function PickRow({
  name,
  icon,
  count,
  pressed,
  onToggle,
}: {
  name: string;
  icon?: ReactNode;
  count: number;
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className="flex min-h-11 min-w-0 grow cursor-pointer items-center gap-2.5 rounded-sm px-1.5 text-start text-[14px] transition-colors duration-150 ease-out hover:bg-canvas"
    >
      <span
        aria-hidden="true"
        className={`grid size-4 shrink-0 place-items-center rounded-[3px] shadow-raised transition-colors duration-150 ease-out ${pressed ? 'bg-ink text-canvas' : 'bg-surface'}`}
      >
        {pressed && (
          <svg viewBox="0 0 12 12" className="size-3">
            <path
              d="M2.5 6.5 5 9l4.5-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {icon}
      <span className="grow">{name}</span>
      <span className="text-[12px] text-muted tabular-nums">{taskCount(count)}</span>
    </button>
  );
}

/**
 * Picks whose work to show. Any number can be picked; everything else fades, and empty chapters fold away.
 * It's also where teams are added, and where Rename opens a team in the drawer.
 */
export function TeamPopover({
  teams,
  activities,
  picked,
  onToggle,
  onRename,
  onAdd,
  triggerRef,
}: {
  teams: TeamView[];
  activities: ActivityView[];
  picked: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onRename: (id: string) => void;
  onAdd: (name: string) => void;
  triggerRef?: Ref<HTMLButtonElement>;
}) {
  const tasks = activities.flatMap((activity) => activity.tasks);
  const [open, setOpen] = useState(false);
  return (
    <PopoverRoot
      open={open}
      onOpenChange={(next, details) => {
        // Esc in the Add team field ends only the field, which marks the key as used.
        if (!next && details.reason === 'escape-key' && details.event.defaultPrevented) {
          details.cancel();
          return;
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger ref={triggerRef} className={`${BUTTON} shrink-0 shadow-raised`}>
        Teams
      </PopoverTrigger>
      <PopoverPanel align="end" className="w-[min(18rem,calc(100vw-2rem))] p-3">
        <PopoverTitle className="px-1.5 pt-1 text-[13px] font-semibold">Show a team’s tasks</PopoverTitle>
        <ul aria-label="Teams" className="mt-2 flex flex-col gap-0.5">
          {teams.map((team) => {
            const pressed = picked.has(team.id);
            return (
              <li key={team.id} className="group/team flex items-center gap-1">
                <PickRow
                  name={team.name}
                  count={tasks.filter((task) => task.teamId === team.id).length}
                  pressed={pressed}
                  onToggle={() => {
                    onToggle(team.id);
                  }}
                />
                <button
                  type="button"
                  aria-label={`Rename ${team.name}`}
                  onClick={() => {
                    setOpen(false);
                    onRename(team.id);
                  }}
                  className="relative shrink-0 cursor-pointer rounded-sm px-1.5 text-[12px] text-muted opacity-0 transition-[opacity,color] duration-150 ease-out group-hover/team:opacity-100 before:absolute before:inset-x-0 before:-inset-y-3 hover:text-ink focus-visible:opacity-100 max-lg:min-h-11 max-lg:opacity-100"
                >
                  Rename
                </button>
              </li>
            );
          })}
          {teams.length > 0 && (
            <li className="flex items-center gap-1">
              <PickRow
                name="No team"
                count={tasks.filter((task) => task.teamId === null).length}
                pressed={picked.has(NO_TEAM)}
                onToggle={() => {
                  onToggle(NO_TEAM);
                }}
              />
              {/* Holds the place of Rename, so the counts line up. */}
              <span aria-hidden="true" className="invisible shrink-0 px-1.5 text-[12px] max-lg:min-h-11">
                Rename
              </span>
            </li>
          )}
        </ul>
        <div className="mt-1 flex min-h-10 items-center px-1.5">
          <AddControl
            action="Add team"
            label="New team name"
            placeholder="Team name"
            buttonClassName="-ms-2 text-muted hover:text-ink max-lg:h-11"
            fieldClassName="py-2 text-base leading-[1.35] lg:text-[14px]"
            onAdd={onAdd}
          />
        </div>
        {teams.length > 0 && (
          <p className="mx-1.5 mt-3 border-t-(length:--hairline) border-line pt-3 text-[12px] leading-snug text-pretty text-muted">
            Other tasks fade, and chapters with none of theirs fold away.
          </p>
        )}
      </PopoverPanel>
    </PopoverRoot>
  );
}
