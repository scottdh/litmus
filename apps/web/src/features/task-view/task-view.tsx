'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { DisclosurePanel, DisclosureRoot, DisclosureTrigger } from '../../ui/disclosure';
import { LightMark } from '../map/light-mark';
import { LIGHT_COPY, MARK_COLOUR } from '../map/lights';
import { StepMark } from '../map/step-mark';
import type { Light } from '@litmus/core';
import type { ReactNode } from 'react';
import type { OutlineChapter, TaskViewModel } from './model';
import { Children, Heading, History, LightNow, Neighbours, Research, taskViewHref } from './sections';

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0 text-muted transition-transform duration-150 ease-out group-data-panel-open:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

// The ring sits inside the row, so the scrolling column can't clip it.
const ROW =
  'flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left leading-snug text-pretty transition-colors duration-150 ease-out hover:bg-sunken focus-visible:-outline-offset-2 max-lg:min-h-11';
const HERE = 'bg-sunken text-ink shadow-current';

function OutlineRow({
  id,
  current,
  className,
  mark,
  children,
}: {
  id: string;
  current: boolean;
  className: string;
  mark: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={taskViewHref(id)}
      aria-current={current ? 'page' : undefined}
      className={`${ROW} ${className} ${current ? HERE : ''}`}
    >
      <span className="flex h-[1lh] shrink-0 items-center">{mark}</span>
      {children}
    </Link>
  );
}

function Mark({ light, size }: { light: Light; size: string }) {
  return (
    <span className={MARK_COLOUR[light]}>
      <LightMark light={light} className={size} />
      <span className="sr-only">{LIGHT_COPY[light].label}: </span>
    </span>
  );
}

const BRANCH = 'ms-3.5 flex flex-col border-s-(length:--hairline) border-line ps-1.5';

function OutlineTasks({ chapter }: { chapter: OutlineChapter }) {
  return (
    <ul className="flex flex-col pb-2">
      {chapter.tasks.map((task) => (
        <li key={task.id}>
          <OutlineRow
            id={task.id}
            current={task.current}
            className="text-[14px]"
            mark={<Mark light={task.light} size="size-3" />}
          >
            {task.name}
          </OutlineRow>
          {task.subtasks.length > 0 && (
            <ul className={BRANCH}>
              {task.subtasks.map((sub) => (
                <li key={sub.id}>
                  <OutlineRow
                    id={sub.id}
                    current={sub.current}
                    className={`text-[13px] ${sub.current ? '' : 'text-muted'}`}
                    mark={<Mark light={sub.light} size="size-2.5" />}
                  >
                    {sub.name}
                  </OutlineRow>
                  {sub.steps.length > 0 && (
                    <ol className={BRANCH}>
                      {sub.steps.map((step) => (
                        <li key={step.id}>
                          <OutlineRow
                            id={step.id}
                            current={step.current}
                            className={`text-[13px] ${step.current ? '' : 'text-muted'}`}
                            mark={<StepMark className="" />}
                          >
                            {step.name}
                          </OutlineRow>
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Every chapter by number and name, with the one holding the page open. Any other opens in place. */
function StoryOutline({ outline, pageId }: { outline: OutlineChapter[]; pageId: string }) {
  return (
    <div className="flex flex-col">
      {outline.map((chapter) => (
        // Keyed with the page, so moving to another chapter opens that one.
        <DisclosureRoot key={`${chapter.id}-${pageId}`} defaultOpen={chapter.open}>
          <DisclosureTrigger
            className={`group flex w-full cursor-pointer items-baseline gap-2 rounded-sm px-2 py-2 text-left transition-colors duration-150 ease-out hover:bg-sunken focus-visible:-outline-offset-2 max-lg:min-h-11 ${chapter.open ? '' : 'text-muted hover:text-ink'}`}
          >
            <span className="w-4 shrink-0 text-[12px] text-muted tabular-nums">{chapter.number}</span>
            <span className="flex-1 font-story text-[17px] leading-[1.2] text-pretty">{chapter.name}</span>
            <Chevron />
          </DisclosureTrigger>
          <DisclosurePanel>
            <div className="ps-6">
              <OutlineTasks chapter={chapter} />
            </div>
          </DisclosurePanel>
        </DisclosureRoot>
      ))}
    </div>
  );
}

const scrollToCurrent = (within: HTMLElement | null, block: ScrollLogicalPosition) => {
  within?.querySelector('[aria-current="page"]')?.scrollIntoView({ block });
};

function BackLink({ model }: { model: TaskViewModel }) {
  return (
    <Link
      href={`/?task=${model.page.id}`}
      className="flex items-center gap-1.5 self-start rounded-sm px-2 py-1.5 text-[13px] text-muted transition-colors duration-150 ease-out hover:bg-sunken hover:text-ink max-lg:min-h-11"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M13 8H3.5M7.5 4 3.5 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {model.mapName}
    </Link>
  );
}

/** A page of its own for a task, subtask or step, with the whole story beside it. Read-only. */
export function TaskView({ model }: { model: TaskViewModel }) {
  const { page } = model;
  const wide = useRef<HTMLElement>(null);
  const narrow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollToCurrent(wide.current, 'nearest');
  }, [page.id]);

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[20rem_minmax(0,1fr)]">
      {/* The story comes first, so keyboard users can jump past it. */}
      <a
        href="#page"
        className="sr-only rounded-sm bg-surface text-[13px] shadow-raised focus-visible:not-sr-only focus-visible:px-3 focus-visible:py-2 focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-10"
      >
        Skip to the page
      </a>
      <aside className="border-line max-lg:border-b-(length:--hairline) lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:overscroll-contain lg:border-e-(length:--hairline)">
        <div className="flex flex-col gap-4 p-3 lg:pb-24">
          <BackLink model={model} />
          <nav ref={wide} aria-label="The story" className="max-lg:hidden">
            <StoryOutline outline={model.outline} pageId={page.id} />
          </nav>
          <DisclosureRoot
            key={page.id}
            className="lg:hidden"
            onOpenChange={(open) => {
              if (open)
                requestAnimationFrame(() => {
                  scrollToCurrent(narrow.current, 'center');
                });
            }}
          >
            <DisclosureTrigger className="group flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-sm px-2 text-left text-[13px] text-muted transition-colors duration-150 ease-out hover:bg-sunken hover:text-ink">
              <span className="flex-1 text-pretty">
                Chapter {page.chapter.number} · {page.chapter.name}
              </span>
              <Chevron />
            </DisclosureTrigger>
            <DisclosurePanel>
              <nav ref={narrow} aria-label="The story" className="pt-2">
                <StoryOutline outline={model.outline} pageId={page.id} />
              </nav>
            </DisclosurePanel>
          </DisclosureRoot>
        </div>
      </aside>
      <main id="page" className="mx-auto flex w-full max-w-[44rem] flex-col gap-10 px-4 pt-10 pb-32 lg:px-12 lg:pt-14">
        <div className="flex flex-col gap-6">
          <Heading model={model} />
          <LightNow model={model} />
        </div>
        <Research model={model} />
        <History model={model} />
        {model.children.length > 0 && (
          <div className="lg:hidden">
            <Children model={model} />
          </div>
        )}
        <Neighbours model={model} />
      </main>
    </div>
  );
}
