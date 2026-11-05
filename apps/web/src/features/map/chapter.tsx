'use client';
import type { ActivityView, Light, SubtaskView, TaskView } from '@litmus/core';
import type { PointerEvent } from 'react';
import { DisclosurePanel, DisclosureRoot, DisclosureTrigger } from '../../ui/disclosure';
import { AddControl } from './add-field';
import type { ChapterState } from './focus';
import { LightMark } from './light-mark';
import { LIGHT_COPY, MARK_COLOUR } from './lights';
import { MixBar } from './mix-bar';
import { StepMark } from './step-mark';

const isDimmed = (light: Light, dim: Light | null) => dim !== null && light !== dim;

function isTaskDimmed(task: TaskView, dim: Light | null) {
  return isDimmed(task.light, dim) && task.subtasks.every((sub) => isDimmed(sub.light, dim));
}

const DIMMED = 'opacity-30';

const subtaskCount = (count: number) => `${String(count)} ${count === 1 ? 'subtask' : 'subtasks'}`;

const NAME_STYLE =
  'underline decoration-transparent decoration-from-font underline-offset-2 transition-[text-decoration-color] duration-150 ease-out group-hover/row:decoration-current group-aria-current/row:decoration-current';

const stepCount = (count: number) => `${String(count)} ${count === 1 ? 'step' : 'steps'}`;

function Chevron() {
  return (
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
  );
}

function SubtaskRow({
  sub,
  open,
  selectedId,
  onStartDrag,
  onOpenDrawer,
  onToggle,
}: {
  sub: SubtaskView;
  open: boolean;
  selectedId: string | null;
  onStartDrag: (id: string, name: string, event: PointerEvent) => void;
  onOpenDrawer: (id: string) => void;
  onToggle: (open: boolean) => void;
}) {
  const opensDrawer = (
    <button
      type="button"
      id={`open-${sub.id}`}
      aria-current={selectedId === sub.id ? 'true' : undefined}
      onPointerDown={(event) => {
        onStartDrag(sub.id, sub.name, event);
      }}
      onClick={() => {
        onOpenDrawer(sub.id);
      }}
      className="group/row flex min-h-9 min-w-0 grow cursor-pointer items-start gap-2 py-2 text-left text-[14px] leading-[1.35] text-pretty text-muted max-lg:min-h-11"
    >
      <span className={`pt-1 ${MARK_COLOUR[sub.light]}`}>
        <LightMark light={sub.light} className="size-3" />
        <span className="sr-only">{LIGHT_COPY[sub.light].label}: </span>
      </span>
      <span className={NAME_STYLE}>{sub.name}</span>
    </button>
  );

  if (sub.steps.length === 0) return <div className="flex">{opensDrawer}</div>;

  return (
    <DisclosureRoot open={open} onOpenChange={onToggle}>
      <div className="flex items-start gap-1">
        {opensDrawer}
        <DisclosureTrigger
          aria-label={`${stepCount(sub.steps.length)} of ${sub.name}`}
          className="group flex min-h-9 shrink-0 cursor-pointer items-start justify-end gap-1 self-stretch ps-1 pt-2.5 text-[12px] text-muted tabular-nums transition-colors duration-150 ease-out hover:text-ink max-lg:min-h-11 max-lg:min-w-11"
        >
          <span aria-hidden="true">{sub.steps.length}</span>
          <Chevron />
        </DisclosureTrigger>
      </div>
      <DisclosurePanel>
        <ol aria-label={`Steps of ${sub.name}`} className="mb-1 ml-5">
          {sub.steps.map((step) => (
            <li key={step.id}>
              <button
                type="button"
                id={`open-${step.id}`}
                aria-current={selectedId === step.id ? 'true' : undefined}
                onClick={() => {
                  onOpenDrawer(step.id);
                }}
                className="group/row flex min-h-8 w-full cursor-pointer items-start gap-2 py-1.5 text-left text-[13px] leading-[1.35] text-pretty text-muted max-lg:min-h-11"
              >
                <StepMark />
                <span className={NAME_STYLE}>{step.name}</span>
              </button>
            </li>
          ))}
        </ol>
      </DisclosurePanel>
    </DisclosureRoot>
  );
}

function TaskRow({
  task,
  open,
  openItems,
  dim,
  selectedId,
  draggingId,
  onStartDrag,
  onOpenDrawer,
  onToggle,
  onToggleItem,
}: {
  task: TaskView;
  open: boolean;
  openItems: ReadonlySet<string>;
  dim: Light | null;
  selectedId: string | null;
  draggingId: string | null;
  onStartDrag: (id: string, name: string, event: PointerEvent) => void;
  onOpenDrawer: (id: string) => void;
  onToggle: (open: boolean) => void;
  onToggleItem: (id: string, open: boolean) => void;
}) {
  const dimmed = isTaskDimmed(task, dim) || draggingId === task.id ? DIMMED : '';
  const opensDrawer = (
    <button
      type="button"
      id={`open-${task.id}`}
      aria-current={selectedId === task.id ? 'true' : undefined}
      onPointerDown={(event) => {
        onStartDrag(task.id, task.name, event);
      }}
      onClick={() => {
        onOpenDrawer(task.id);
      }}
      className="group/row flex min-h-10 min-w-0 grow cursor-pointer items-start gap-2.5 py-2 text-left text-[15px] leading-[1.35] text-pretty max-lg:min-h-11"
    >
      <span className={`pt-1 ${MARK_COLOUR[task.light]}`}>
        <LightMark light={task.light} />
        <span className="sr-only">{LIGHT_COPY[task.light].label}: </span>
      </span>
      <span className={NAME_STYLE}>{task.name}</span>
    </button>
  );

  if (task.subtasks.length === 0) {
    return (
      <div data-drop-task={task.id} className={`flex transition-opacity duration-150 ease-out ${dimmed}`}>
        {opensDrawer}
      </div>
    );
  }

  return (
    <DisclosureRoot open={open} onOpenChange={onToggle}>
      <div
        data-drop-task={task.id}
        className={`flex items-start gap-2 transition-opacity duration-150 ease-out ${dimmed}`}
      >
        {opensDrawer}
        <DisclosureTrigger
          aria-label={`${subtaskCount(task.subtasks.length)} of ${task.name}`}
          className="group flex min-h-10 shrink-0 cursor-pointer items-start gap-1.5 self-stretch ps-1 pt-3 text-[12px] text-muted tabular-nums transition-colors duration-150 ease-out hover:text-ink max-lg:min-h-11"
        >
          <MixBar mix={task.mix} className="mt-1 h-1 w-8 rounded-full" />
          <span aria-hidden="true">{task.subtasks.length}</span>
          <Chevron />
        </DisclosureTrigger>
      </div>
      <DisclosurePanel>
        <ol className="mb-2 ml-6">
          {task.subtasks.map((sub) => (
            <li
              key={sub.id}
              data-drop-task={sub.id}
              className={`transition-opacity duration-150 ease-out ${isDimmed(sub.light, dim) || draggingId === sub.id ? DIMMED : ''}`}
            >
              <SubtaskRow
                sub={sub}
                open={openItems.has(sub.id)}
                selectedId={selectedId}
                onStartDrag={onStartDrag}
                onOpenDrawer={onOpenDrawer}
                onToggle={(next) => {
                  onToggleItem(sub.id, next);
                }}
              />
            </li>
          ))}
        </ol>
      </DisclosurePanel>
    </DisclosureRoot>
  );
}

const CUE: Record<ChapterState, string> = { rest: 'Focus', focused: 'Focused', background: 'Add to focus' };

const CUE_STYLE: Record<ChapterState, string> = {
  rest: 'opacity-0 group-hover/head:opacity-100 group-focus-visible/head:opacity-100 max-lg:opacity-100',
  focused: 'text-ink',
  background: 'max-lg:opacity-100 lg:hidden',
};

// The width animates because task text sits in a fixed-width box, so nothing reflows on the way.
const COLUMN_MOTION = 'lg:[transition:width_var(--motion-focus),padding_var(--motion-focus)]';
const NAME_MOTION = '[transition:opacity_var(--motion-focus),color_150ms_ease-out]';
// Tasks stay visible while they fade out, and become visible at once when they fade back in.
const TASKS_MOTION = '[transition:opacity_var(--motion-focus),visibility_0s]';
const TASKS_LEAVING_MOTION = '[transition:opacity_var(--motion-focus),visibility_0s_linear_240ms]';

export function Chapter({
  activity,
  position,
  state,
  animate,
  dim,
  openTasks,
  selectedId,
  draggingId,
  onStartDrag,
  onOpenDrawer,
  onToggleFocus,
  onToggleTask,
  startAdding,
  onAddTask,
}: {
  activity: ActivityView;
  position: number;
  state: ChapterState;
  animate: boolean;
  dim: Light | null;
  openTasks: ReadonlySet<string>;
  selectedId: string | null;
  draggingId: string | null;
  onStartDrag: (id: string, name: string, event: PointerEvent) => void;
  onOpenDrawer: (id: string) => void;
  onToggleFocus: () => void;
  onToggleTask: (id: string, open: boolean) => void;
  startAdding: boolean;
  onAddTask: (name: string) => void;
}) {
  const inBackground = state === 'background';
  const tasksMotion = inBackground ? TASKS_LEAVING_MOTION : TASKS_MOTION;

  return (
    <section
      aria-labelledby={`${activity.id}-name`}
      data-drop-chapter={activity.id}
      className={`group/chapter relative shrink-0 lg:overflow-x-clip lg:border-l-(length:--hairline) lg:border-line lg:[overflow-clip-margin:6px] lg:first:border-l-0 lg:first:pl-0 ${inBackground ? 'lg:w-29 lg:px-3.5' : 'lg:w-68 lg:px-5'} ${animate ? COLUMN_MOTION : ''}`}
    >
      <div className="lg:w-58 lg:group-first/chapter:w-63">
        <h2 id={`${activity.id}-name`} className="relative">
          <button
            type="button"
            aria-pressed={state === 'focused'}
            onClick={onToggleFocus}
            className={`group/head block w-full cursor-pointer text-left ${inBackground ? 'after:absolute after:inset-0 after:z-1' : ''}`}
          >
            <span className="block text-[13px] text-muted tabular-nums">
              Chapter {position}
              <span
                aria-hidden="true"
                className={`ms-2 ${animate ? 'transition-opacity duration-150 ease-out' : ''} ${CUE_STYLE[state]}`}
              >
                {CUE[state]}
              </span>
            </span>
            <span className="relative mt-1 block lg:min-h-16">
              <span
                className={`block font-story text-[28px] leading-[1.1] tracking-[-0.01em] text-balance ${inBackground ? 'max-lg:sr-only lg:opacity-0' : ''} ${animate ? NAME_MOTION : ''}`}
              >
                {activity.name}
              </span>
              <span
                aria-hidden="true"
                className={`pointer-events-none font-story text-[17px] leading-[1.2] text-muted group-hover/head:text-ink wrap-anywhere lg:absolute lg:top-0 lg:left-0 lg:w-22 ${inBackground ? 'block' : 'opacity-0 max-lg:hidden'} ${animate ? NAME_MOTION : ''}`}
              >
                {activity.name}
              </span>
            </span>
          </button>
          {!inBackground && (
            <button
              type="button"
              id={`open-${activity.id}`}
              aria-label={`Rename ${activity.name}`}
              aria-current={selectedId === activity.id ? 'true' : undefined}
              onClick={() => {
                onOpenDrawer(activity.id);
              }}
              className="absolute top-0 right-0 cursor-pointer text-[13px] text-muted opacity-0 transition-[opacity,color] duration-150 ease-out group-hover/chapter:opacity-100 before:absolute before:inset-x-0 before:-inset-y-3 hover:text-ink focus-visible:opacity-100 aria-current:text-ink aria-current:opacity-100 max-lg:opacity-100"
            >
              Rename
            </button>
          )}
        </h2>
        <div
          inert={inBackground}
          className={`${inBackground ? 'max-lg:hidden lg:invisible lg:opacity-0' : ''} ${animate ? tasksMotion : ''}`}
        >
          <MixBar mix={activity.mix} className="mt-3 h-1 rounded-full" />
          {activity.tasks.length === 0 ? (
            <p className="mt-4 font-story text-[17px] text-muted">Nothing mapped here yet.</p>
          ) : (
            <ol className="mt-3">
              {activity.tasks.map((task) => (
                <li key={task.id} className="border-b-(length:--hairline) border-line last:border-b-0">
                  <TaskRow
                    task={task}
                    open={openTasks.has(task.id)}
                    openItems={openTasks}
                    dim={dim}
                    selectedId={selectedId}
                    draggingId={draggingId}
                    onStartDrag={onStartDrag}
                    onOpenDrawer={onOpenDrawer}
                    onToggle={(next) => {
                      onToggleTask(task.id, next);
                    }}
                    onToggleItem={onToggleTask}
                  />
                </li>
              ))}
            </ol>
          )}
          <div className="mt-1 flex min-h-10 items-center">
            <AddControl
              action="Add task"
              label={`New task in ${activity.name}`}
              placeholder="Task name"
              startOpen={startAdding}
              buttonClassName="-ms-2 text-muted hover:text-ink max-lg:h-11"
              fieldClassName="py-2 text-base leading-[1.35] lg:text-[15px]"
              onAdd={onAddTask}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
