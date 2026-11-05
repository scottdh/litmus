'use client';
import { LIGHTS, type Light, type MapView } from '@litmus/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chapter } from './chapter';
import { Drawer } from './drawer';
import { chapterState, focusSummary } from './focus';
import { LightMark } from './light-mark';
import { FILL_COLOUR, LIGHT_COPY } from './lights';
import type { ReviewDraft } from './rating-section';
import type { Rate, Rename } from './rename-result';
import { findSubject } from './subject';
import { useChapterFocus } from './use-chapter-focus';

const TOOLBAR_BUTTON =
  'relative h-8 shrink-0 cursor-pointer rounded-sm px-2 text-[13px] font-medium shadow-raised transition-transform duration-150 ease-out before:absolute before:inset-x-0 before:-inset-y-1.5 active:scale-[0.96]';

/** Puts typed-but-unsaved names over the map, so it follows what's being typed. */
function withDrafts(map: MapView, drafts: Record<string, string>): MapView {
  const apply = <T extends { id: string; name: string }>(item: T): T => ({
    ...item,
    name: drafts[item.id] ?? item.name,
  });
  return {
    ...map,
    activities: map.activities.map((activity) => ({
      ...apply(activity),
      tasks: activity.tasks.map((task) => ({ ...apply(task), subtasks: task.subtasks.map(apply) })),
    })),
  };
}

export function StoryWall({
  map: savedMap,
  isSample,
  rename,
  rate,
}: {
  map: MapView;
  isSample: boolean;
  rename: Rename;
  rate: Rate;
}) {
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [dim, setDim] = useState<Light | null>(null);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saveFailed, setSaveFailed] = useState(false);
  const map = useMemo(() => withDrafts(savedMap, drafts), [savedMap, drafts]);
  const chapterIds = useMemo(() => map.activities.map((activity) => activity.id), [map]);
  const {
    focus,
    animate,
    toggle: toggleChapter,
    clear,
  } = useChapterFocus(savedMap.id, chapterIds, selectedId === null);
  const focusing = focus.length > 0;
  const expandAll = useRef<HTMLButtonElement>(null);
  const summary = focusSummary(map.activities, focus);
  const found = selectedId === null ? null : findSubject(map, selectedId);
  // A chapter that's gone to the background has no tasks on show, so its drawer closes too.
  const subject = found && (focus.length === 0 || focus.includes(found.chapterId)) ? found : null;

  const closeDrawer = useCallback(() => {
    setSelectedId((id) => {
      if (id !== null) document.getElementById(`open-${id}`)?.focus({ preventScroll: true });
      return null;
    });
  }, []);

  const openDrawer = (id: string) => {
    setSaveFailed(false);
    setSelectedId(id);
    // After the story has made room, so the row stays in view beside the drawer.
    requestAnimationFrame(() => {
      document.getElementById(`open-${id}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  };

  const drawerOpen = selectedId !== null;
  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // A form inside the drawer may have used this Esc already.
      if (event.key === 'Escape' && !event.defaultPrevented) closeDrawer();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [drawerOpen, closeDrawer]);

  const dropDraft = (id: string) => {
    setDrafts((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== id)));
  };

  const saveName = (id: string, kind: 'chapter' | 'task', name: string) => {
    setSaveFailed(false);
    void rename({ mapId: savedMap.id, kind, id, name }).then(
      (result) => {
        dropDraft(id);
        if (!result.ok) setSaveFailed(true);
      },
      () => {
        dropDraft(id);
        setSaveFailed(true);
      },
    );
  };

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
          Sample data: an invented bike workshop. These ratings aren’t real, and changes last until the server restarts.
        </p>
      )}
      <header
        className={`flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-10 ${subject ? 'max-lg:invisible' : ''}`}
      >
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

      <div
        className={`my-4 flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-y-(length:--hairline) border-line py-2 ${subject ? 'max-lg:invisible' : ''}`}
      >
        <p aria-live="polite" className="min-w-48 flex-1 text-[14px] leading-snug text-pretty text-muted">
          {[
            saveFailed ? 'That name couldn’t be saved, so the old one is back.' : '',
            summary,
            dim !== null ? `${LIGHT_COPY[dim].label}: ${LIGHT_COPY[dim].meaning}` : '',
          ]
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

      <div className="flex items-start gap-4">
        <div
          tabIndex={0}
          role="region"
          aria-label="The story, left to right"
          className={`flex min-w-0 grow flex-col lg:-ms-4 lg:flex-row lg:gap-0 lg:overflow-x-auto lg:ps-4 lg:pb-4 ${subject ? 'max-lg:invisible lg:me-0' : 'lg:-me-4 lg:pe-4'} ${focusing ? 'gap-5' : 'gap-10'}`}
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
              selectedId={subject?.id ?? null}
              onOpenDrawer={openDrawer}
              onToggleFocus={() => {
                toggleChapter(activity.id);
              }}
              onToggleTask={toggleTask}
            />
          ))}
        </div>
        {subject && (
          <Drawer
            mapId={savedMap.id}
            rate={rate}
            reviewDraft={reviewDrafts[subject.id] ?? null}
            onReviewDraft={(draft) => {
              setReviewDrafts((current) => {
                const rest = Object.fromEntries(Object.entries(current).filter(([key]) => key !== subject.id));
                return draft === null ? rest : { ...rest, [subject.id]: draft };
              });
            }}
            onOpenSubtask={(id) => {
              // So the subtask's row is on show, for its underline and to return focus to.
              toggleTask(subject.id, true);
              openDrawer(id);
            }}
            subject={subject}
            onDraft={(name) => {
              setDrafts((current) => ({ ...current, [subject.id]: name }));
            }}
            onSave={(name) => {
              saveName(subject.id, subject.kind === 'chapter' ? 'chapter' : 'task', name);
            }}
            onClose={closeDrawer}
          />
        )}
      </div>
    </main>
  );
}
