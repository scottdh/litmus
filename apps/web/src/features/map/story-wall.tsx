'use client';
import { LIGHTS, type Light, type MapView } from '@litmus/core';
import { useMemo, useRef, useState } from 'react';
import { Chapter } from './chapter';
import { chapterState, focusSummary } from './focus';
import { LightMark } from './light-mark';
import { FILL_COLOUR, LIGHT_COPY } from './lights';
import { useChapterFocus } from './use-chapter-focus';

const TOOLBAR_BUTTON =
  'relative h-8 shrink-0 cursor-pointer rounded-sm px-2 text-[13px] font-medium shadow-raised transition-transform duration-150 ease-out before:absolute before:inset-x-0 before:-inset-y-1.5 active:scale-[0.96]';

export function StoryWall({ map, isSample }: { map: MapView; isSample: boolean }) {
  const [dim, setDim] = useState<Light | null>(null);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const chapterIds = useMemo(() => map.activities.map((activity) => activity.id), [map]);
  const { focus, animate, toggle: toggleChapter, clear } = useChapterFocus(map.id, chapterIds);
  const focusing = focus.length > 0;
  const expandAll = useRef<HTMLButtonElement>(null);
  const summary = focusSummary(map.activities, focus);

  // While focusing, Expand all only reaches the chapters you can see.
  const parentIds = useMemo(
    () =>
      map.activities
        .filter((activity) => focus.length === 0 || focus.includes(activity.id))
        .flatMap((activity) => activity.tasks)
        .filter((task) => task.subtasks.length > 0)
        .map((task) => task.id),
    [map, focus],
  );
  const allOpen = parentIds.length > 0 && parentIds.every((id) => open.has(id));

  const toggleTask = (id: string, next: boolean) => {
    setOpen((current) => {
      const updated = new Set(current);
      if (next) updated.add(id);
      else updated.delete(id);
      return updated;
    });
  };

  const toggleAll = () => {
    setOpen((current) => {
      const updated = new Set(current);
      for (const id of parentIds) {
        if (allOpen) updated.delete(id);
        else updated.add(id);
      }
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

      <div className="my-4 flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-y-(length:--hairline) border-line py-2">
        <p aria-live="polite" className="min-w-48 flex-1 text-[14px] leading-snug text-pretty text-muted">
          {[summary, dim !== null ? `${LIGHT_COPY[dim].label}: ${LIGHT_COPY[dim].meaning}` : '']
            .filter(Boolean)
            .join(' ')}
        </p>
        <div className="ms-auto flex shrink-0 gap-2">
          {focusing && (
            <button
              type="button"
              onClick={() => {
                clear();
                // This button is about to disappear, so keyboard users need somewhere to land.
                expandAll.current?.focus();
              }}
              className={TOOLBAR_BUTTON}
            >
              Show the whole story
            </button>
          )}
          <button ref={expandAll} type="button" onClick={toggleAll} className={TOOLBAR_BUTTON}>
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-label="The story, left to right"
        className={`flex flex-col lg:-mx-4 lg:flex-row lg:gap-0 lg:overflow-x-auto lg:px-4 lg:pb-4 ${focusing ? 'gap-5' : 'gap-10'}`}
      >
        {map.activities.map((activity, index) => (
          <Chapter
            key={activity.id}
            activity={activity}
            position={index + 1}
            state={chapterState(focus, activity.id)}
            animate={animate}
            dim={dim}
            openTasks={open}
            onToggleFocus={() => {
              toggleChapter(activity.id);
            }}
            onToggleTask={toggleTask}
          />
        ))}
      </div>
    </main>
  );
}
