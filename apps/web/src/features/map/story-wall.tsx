'use client';
import { LIGHTS, type Light, type MapView, type TaskView } from '@litmus/core';
import { useMemo, useState } from 'react';
import { DisclosurePanel, DisclosureRoot, DisclosureTrigger } from '../../ui/disclosure';
import { LightMark } from './light-mark';
import { FILL_COLOUR, LIGHT_COPY, MARK_COLOUR } from './lights';
import { MixBar } from './mix-bar';

const isDimmed = (light: Light, dim: Light | null) => dim !== null && light !== dim;

function isTaskDimmed(task: TaskView, dim: Light | null) {
  return isDimmed(task.light, dim) && task.subtasks.every((sub) => isDimmed(sub.light, dim));
}

const DIMMED = 'opacity-30';

const subtaskCount = (count: number) => `${String(count)} ${count === 1 ? 'subtask' : 'subtasks'}`;

function TaskRow({
  task,
  open,
  dim,
  onToggle,
}: {
  task: TaskView;
  open: boolean;
  dim: Light | null;
  onToggle: (open: boolean) => void;
}) {
  const row = `flex w-full items-start gap-2.5 py-2 text-[15px] leading-[1.35] text-pretty ${isTaskDimmed(task, dim) ? DIMMED : ''}`;
  const mark = (
    <span className={`pt-1 ${MARK_COLOUR[task.light]}`}>
      <LightMark light={task.light} />
      <span className="sr-only">{LIGHT_COPY[task.light].label}: </span>
    </span>
  );

  if (task.subtasks.length === 0) {
    return (
      <div className={`${row} transition-opacity duration-150 ease-out`}>
        {mark}
        <span>{task.name}</span>
      </div>
    );
  }

  return (
    <DisclosureRoot open={open} onOpenChange={onToggle}>
      <DisclosureTrigger
        className={`${row} group min-h-11 cursor-pointer text-left transition-[opacity,color] duration-150 ease-out hover:text-muted`}
      >
        {mark}
        <span className="grow">{task.name}</span>
        <span className="flex shrink-0 items-center gap-1.5 pt-1 text-[12px] text-muted tabular-nums">
          <span className="sr-only">{subtaskCount(task.subtasks.length)}: </span>
          <MixBar mix={task.mix} className="h-1 w-8 rounded-full" />
          <span aria-hidden="true">{task.subtasks.length}</span>
          <svg
            viewBox="0 0 12 12"
            aria-hidden="true"
            className="size-3 shrink-0 transition-transform duration-150 ease-out group-data-panel-open:rotate-90"
          >
            <path
              d="M4.5 2.5 8 6 4.5 9.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </DisclosureTrigger>
      <DisclosurePanel>
        <ol className="mb-2 ml-6">
          {task.subtasks.map((sub) => (
            <li
              key={sub.id}
              className={`flex items-start gap-2 py-1 text-[14px] leading-[1.35] text-pretty text-muted transition-opacity duration-150 ease-out ${isDimmed(sub.light, dim) ? DIMMED : ''}`}
            >
              <span className={`pt-1 ${MARK_COLOUR[sub.light]}`}>
                <LightMark light={sub.light} className="size-3" />
                <span className="sr-only">{LIGHT_COPY[sub.light].label}: </span>
              </span>
              <span>{sub.name}</span>
            </li>
          ))}
        </ol>
      </DisclosurePanel>
    </DisclosureRoot>
  );
}

export function StoryWall({ map, isSample }: { map: MapView; isSample: boolean }) {
  const [dim, setDim] = useState<Light | null>(null);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const parentIds = useMemo(
    () =>
      map.activities
        .flatMap((activity) => activity.tasks)
        .filter((task) => task.subtasks.length > 0)
        .map((task) => task.id),
    [map],
  );
  const allOpen = parentIds.length > 0 && open.size === parentIds.length;

  const toggle = (id: string, next: boolean) => {
    setOpen((current) => {
      const updated = new Set(current);
      if (next) updated.add(id);
      else updated.delete(id);
      return updated;
    });
  };

  return (
    <main className="mx-auto max-w-[1600px] px-4 pt-4 pb-16">
      {isSample && (
        <p className="mb-5 w-fit rounded-sm bg-light-grey px-2 py-1 text-[13px] text-on-light-grey">
          Sample data: an invented bike workshop. These ratings aren’t real.
        </p>
      )}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div>
          <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.01em] text-balance">{map.name}</h1>
          <p className="mt-1 max-w-[60ch] text-[13px] leading-normal text-pretty text-muted">
            Green means deployed to a real environment and completable end to end with realistic data. Mocks don’t
            count.
          </p>
        </div>
        <ul aria-label="Dim the map to one light" className="flex flex-wrap gap-x-1 gap-y-3 lg:justify-end">
          {LIGHTS.map((light) => (
            <li key={light}>
              <button
                type="button"
                aria-pressed={dim === light}
                onClick={() => {
                  setDim(dim === light ? null : light);
                }}
                className={`relative flex h-8 cursor-pointer items-center gap-1.5 rounded-sm px-2 text-[13px] font-medium transition-transform duration-150 ease-out before:absolute before:inset-x-0 before:-inset-y-1.5 active:scale-[0.96] aria-pressed:outline-2 aria-pressed:outline-offset-1 aria-pressed:outline-ink ${FILL_COLOUR[light]}`}
              >
                <LightMark light={light} className="size-3" />
                {LIGHT_COPY[light].label}
              </button>
            </li>
          ))}
        </ul>
      </header>

      <div className="my-4 flex min-h-12 items-center justify-between gap-4 border-y-(length:--hairline) border-line py-2">
        <p aria-live="polite" className="text-[14px] leading-snug text-muted">
          {dim !== null && `${LIGHT_COPY[dim].label}: ${LIGHT_COPY[dim].meaning}`}
        </p>
        <button
          type="button"
          onClick={() => {
            setOpen(allOpen ? new Set() : new Set(parentIds));
          }}
          className="relative h-8 shrink-0 cursor-pointer rounded-sm px-2 text-[13px] font-medium shadow-raised transition-transform duration-150 ease-out before:absolute before:inset-x-0 before:-inset-y-1.5 active:scale-[0.96]"
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-label="The story, left to right"
        className="flex flex-col gap-10 lg:-mx-4 lg:flex-row lg:gap-0 lg:overflow-x-auto lg:px-4 lg:pb-4"
      >
        {map.activities.map((activity, index) => (
          <section
            key={activity.id}
            aria-labelledby={`${activity.id}-name`}
            className="shrink-0 lg:w-68 lg:border-l-(length:--hairline) lg:border-line lg:px-5 lg:first:border-l-0 lg:first:pl-0"
          >
            <p className="text-[13px] text-muted tabular-nums">Chapter {index + 1}</p>
            <h2
              id={`${activity.id}-name`}
              className="mt-1 font-story text-[28px] leading-[1.1] tracking-[-0.01em] text-balance lg:min-h-16"
            >
              {activity.name}
            </h2>
            <MixBar mix={activity.mix} className="mt-3 h-1 rounded-full" />
            {activity.tasks.length === 0 ? (
              <p className="mt-4 font-story text-[17px] text-muted">Nothing mapped here yet.</p>
            ) : (
              <ol className="mt-3">
                {activity.tasks.map((task) => (
                  <li key={task.id} className="border-b-(length:--hairline) border-line last:border-b-0">
                    <TaskRow
                      task={task}
                      open={open.has(task.id)}
                      dim={dim}
                      onToggle={(next) => {
                        toggle(task.id, next);
                      }}
                    />
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
