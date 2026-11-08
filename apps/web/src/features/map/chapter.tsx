'use client';
import type { ActivityView, Light, PersonaView, SubtaskView, TaskView } from '@litmus/core';
import type { PointerEvent } from 'react';
import { DisclosurePanel, DisclosureRoot, DisclosureTrigger } from '../../ui/disclosure';
import { AddControl } from './add-field';
import type { ChapterState } from './focus';
import { LightMark } from './light-mark';
import { LIGHT_COPY, MARK_COLOUR } from './lights';
import { MixBar } from './mix-bar';
import { PersonaName } from './persona-icon';
import { StepMark } from './step-mark';
import { isChildOffPersona, isOffPick, type PickedPersonas } from './personas';
import { isChildOffTeam, type PickedTeams } from './teams';

const isDimmed = (light: Light, dim: Light | null) => dim !== null && light !== dim;

function isTaskDimmed(task: TaskView, dim: Light | null) {
  return isDimmed(task.light, dim) && task.subtasks.every((sub) => isDimmed(sub.light, dim));
}

const DIMMED = 'opacity-30';

// Where a chapter's task column has room, a task's mix bar and count sit at the end of its name's line, so it's one row.
// The count is drawn one line tall, so it centres on the name's first line, and its target reaches down to the foot
// of the row: 40 px, or 44 px on touch.
const ONE_LINE_ROW = '@min-[24rem]/tasks:flex @min-[24rem]/tasks:items-start @min-[24rem]/tasks:gap-4';
const ONE_LINE_NAME = '@min-[24rem]/tasks:[&>button]:min-h-10 @min-[24rem]/tasks:max-lg:[&>button]:min-h-11';
const ONE_LINE_COUNT = [
  'relative @min-[24rem]/tasks:ms-0 @min-[24rem]/tasks:-me-1.5 @min-[24rem]/tasks:px-1.5',
  '@min-[24rem]/tasks:h-9 @min-[24rem]/tasks:max-lg:h-9',
  '@min-[24rem]/tasks:before:absolute @min-[24rem]/tasks:before:inset-x-0 @min-[24rem]/tasks:before:top-0',
  '@min-[24rem]/tasks:before:-bottom-1 @min-[24rem]/tasks:max-lg:before:-bottom-2',
].join(' ');

const subtaskCount = (count: number) => `${String(count)} ${count === 1 ? 'subtask' : 'subtasks'}`;

// A row goes a shade darker on hover, like every other control, and keeps that fill with a ring while its drawer is open.
// Touch has no hover, so the fill also shows while a row is pressed.
// The fill reaches 6 px past the text so nothing moves. No hover fill while dragging, so only the drop indicator shows where a row lands.
const rowFill = (dragging: boolean) =>
  `-mx-1.5 rounded-sm px-1.5 transition-colors duration-150 ease-out aria-current:bg-sunken aria-current:shadow-current ${dragging ? '' : 'hover:bg-sunken active:bg-sunken'}`;

// The expand control is its own target beside the row, so it fills on its own.
const expandFill = (dragging: boolean) => `-me-1.5 rounded-sm pe-1.5 ${dragging ? '' : 'hover:bg-sunken'}`;

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
  personas,
  pickedPersonas,
  faded,
  open,
  selectedId,
  draggingId,
  onStartDrag,
  onOpenDrawer,
  onToggle,
}: {
  sub: SubtaskView;
  personas: PersonaView[];
  pickedPersonas: PickedPersonas;
  /** Already faded as a whole, so its steps don't fade twice. */
  faded: boolean;
  open: boolean;
  selectedId: string | null;
  draggingId: string | null;
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
      className={`flex min-h-9 min-w-0 grow cursor-pointer items-start gap-2 py-2 text-left text-[14px] leading-[1.35] text-pretty text-muted max-lg:min-h-11 ${rowFill(draggingId !== null)}`}
    >
      <span className={`pt-1 ${MARK_COLOUR[sub.light]}`}>
        <LightMark light={sub.light} className="size-3" />
        <span className="sr-only">{LIGHT_COPY[sub.light].label}: </span>
      </span>
      <PersonaName name={sub.name} personas={personas} ids={sub.personaIds} picked={pickedPersonas} />
    </button>
  );

  if (sub.steps.length === 0) return <div className="flex">{opensDrawer}</div>;

  return (
    <DisclosureRoot open={open} onOpenChange={onToggle}>
      <div className="flex items-start gap-1">
        {opensDrawer}
        <DisclosureTrigger
          aria-label={`${stepCount(sub.steps.length)} of ${sub.name}`}
          className={`group flex min-h-9 shrink-0 cursor-pointer items-start justify-end gap-1 self-stretch ps-1.5 pt-2.5 text-[12px] text-muted tabular-nums transition-colors duration-150 ease-out hover:text-ink max-lg:min-h-11 max-lg:min-w-11 ${expandFill(draggingId !== null)}`}
        >
          <span aria-hidden="true" className="leading-3">
            {sub.steps.length}
          </span>
          <Chevron />
        </DisclosureTrigger>
      </div>
      <DisclosurePanel>
        <ol aria-label={`Steps of ${sub.name}`} className="mb-1 ml-5">
          {sub.steps.map((step) => (
            <li
              key={step.id}
              data-drop-step={step.id}
              className={`transition-opacity duration-150 ease-out ${draggingId === step.id || (!faded && isChildOffPersona(step.personaIds, pickedPersonas)) ? DIMMED : ''}`}
            >
              <button
                type="button"
                id={`open-${step.id}`}
                aria-current={selectedId === step.id ? 'true' : undefined}
                onPointerDown={(event) => {
                  onStartDrag(step.id, step.name, event);
                }}
                onClick={() => {
                  onOpenDrawer(step.id);
                }}
                className={`flex min-h-8 w-[calc(100%+--spacing(3))] cursor-pointer items-start gap-2 py-1.5 text-left text-[13px] leading-[1.35] text-pretty text-muted max-lg:min-h-11 ${rowFill(draggingId !== null)}`}
              >
                <StepMark />
                <PersonaName name={step.name} personas={personas} ids={step.personaIds} picked={pickedPersonas} />
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
  personas,
  pickedTeams,
  pickedPersonas,
  faded,
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
  personas: PersonaView[];
  pickedTeams: PickedTeams;
  pickedPersonas: PickedPersonas;
  /** Already faded as a whole, so its subtasks and steps don't fade twice. */
  faded: boolean;
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
  const hasSubtasks = task.subtasks.length > 0;
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
      className={`flex min-w-0 grow cursor-pointer items-start gap-2.5 py-2 text-left text-[15px] leading-[1.35] text-pretty ${hasSubtasks ? '' : 'min-h-10 max-lg:min-h-11'} ${rowFill(draggingId !== null)}`}
    >
      <span className={`pt-1 ${MARK_COLOUR[task.light]}`}>
        <LightMark light={task.light} />
        <span className="sr-only">{LIGHT_COPY[task.light].label}: </span>
      </span>
      <PersonaName name={task.name} personas={personas} ids={task.personaIds} picked={pickedPersonas} />
    </button>
  );

  if (!hasSubtasks) {
    return (
      <div data-drop-task={task.id} className={`flex transition-opacity duration-150 ease-out ${dimmed}`}>
        {opensDrawer}
      </div>
    );
  }

  return (
    <DisclosureRoot open={open} onOpenChange={onToggle}>
      <div data-drop-task={task.id} className={`transition-opacity duration-150 ease-out ${ONE_LINE_ROW} ${dimmed}`}>
        <div className={`flex min-w-0 grow ${ONE_LINE_NAME}`}>{opensDrawer}</div>
        {/* In a narrow column it sits under the name, so a long name gets the full width.
            It starts 6 px before the name's text, so its fill lines up with the row's. */}
        <DisclosureTrigger
          aria-label={`${subtaskCount(task.subtasks.length)} of ${task.name}`}
          className={`group ms-4.5 flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-sm ps-1.5 pe-1 text-[13px] text-muted tabular-nums transition-[color,background-color,scale] duration-150 ease-out hover:text-ink active:scale-[0.96] max-lg:h-11 ${ONE_LINE_COUNT} ${draggingId === null ? 'hover:bg-sunken' : ''}`}
        >
          <MixBar mix={task.mix} className="h-1 w-8 rounded-full" />
          <span aria-hidden="true">{subtaskCount(task.subtasks.length)}</span>
          <Chevron />
        </DisclosureTrigger>
      </div>
      <DisclosurePanel>
        <ol className="mb-2 ml-6">
          {task.subtasks.map((sub) => {
            const subFaded =
              isDimmed(sub.light, dim) ||
              (!faded && (isChildOffTeam(sub, pickedTeams) || isChildOffPersona(sub.personaIds, pickedPersonas)));
            return (
              <li
                key={sub.id}
                data-drop-task={sub.id}
                className={`transition-opacity duration-150 ease-out ${subFaded || draggingId === sub.id ? DIMMED : ''}`}
              >
                <SubtaskRow
                  personas={personas}
                  pickedPersonas={pickedPersonas}
                  faded={faded || subFaded}
                  sub={sub}
                  open={openItems.has(sub.id)}
                  selectedId={selectedId}
                  draggingId={draggingId}
                  onStartDrag={onStartDrag}
                  onOpenDrawer={onOpenDrawer}
                  onToggle={(next) => {
                    onToggleItem(sub.id, next);
                  }}
                />
              </li>
            );
          })}
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
// While focusing, the box snaps to its final width as the column starts to move, so text rewraps once.
// `--focus-width` comes from the story, which shares out the width the rails leave.
const COLUMN_WIDTH: Record<ChapterState, string> = {
  rest: 'lg:w-68 lg:px-5',
  focused: 'lg:w-(--focus-width) lg:px-5',
  background: 'lg:w-14 lg:px-3',
};
const TEXT_WIDTH: Record<ChapterState, string> = {
  rest: 'lg:w-58 lg:group-first/chapter:w-63',
  focused: 'lg:w-[calc(var(--focus-width)-2.5rem)] lg:group-first/chapter:w-[calc(var(--focus-width)-1.25rem)]',
  background: 'lg:w-[calc(var(--focus-width)-2.5rem)] lg:group-first/chapter:w-[calc(var(--focus-width)-1.25rem)]',
};

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
  teams,
  personas,
  pickedPersonas,
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
  teams: PickedTeams;
  personas: PersonaView[];
  pickedPersonas: PickedPersonas;
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
      className={`group/chapter relative shrink-0 lg:overflow-x-clip lg:border-l-(length:--hairline) lg:border-line lg:[overflow-clip-margin:6px] lg:first:border-l-0 lg:first:pl-0 ${COLUMN_WIDTH[state]} ${animate ? COLUMN_MOTION : ''}`}
    >
      <div className={`@container/tasks ${TEXT_WIDTH[state]}`}>
        <h2 id={`${activity.id}-name`} className="relative">
          <button
            type="button"
            aria-pressed={state === 'focused'}
            onClick={onToggleFocus}
            className={`group/head block w-full cursor-pointer text-left ${inBackground ? 'after:absolute after:inset-0 after:z-1' : ''}`}
          >
            <span
              className={`block text-[13px] text-muted tabular-nums ${inBackground ? 'lg:w-8 lg:text-center' : ''}`}
            >
              <span className="sr-only">Chapter </span>
              {position}
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
                className={`pointer-events-none font-story text-[17px] leading-[1.2] text-muted group-hover/head:text-ink max-lg:wrap-anywhere lg:absolute lg:top-0 lg:left-1.5 lg:whitespace-nowrap lg:[writing-mode:vertical-rl] ${inBackground ? 'block' : 'opacity-0 max-lg:hidden'} ${animate ? NAME_MOTION : ''}`}
              >
                {activity.name}
              </span>
            </span>
          </button>
          {!inBackground && (
            <button
              type="button"
              id={`open-${activity.id}`}
              aria-label={`Open ${activity.name}`}
              aria-current={selectedId === activity.id ? 'true' : undefined}
              onClick={() => {
                onOpenDrawer(activity.id);
              }}
              className="absolute top-0 right-0 cursor-pointer text-[13px] text-muted opacity-0 transition-[opacity,color] duration-150 ease-out group-hover/chapter:opacity-100 before:absolute before:inset-x-0 before:-inset-y-3 hover:text-ink focus-visible:opacity-100 aria-current:text-ink aria-current:opacity-100 max-lg:opacity-100"
            >
              Open
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
              {activity.tasks.map((task) => {
                const offTeam = isOffPick(task, teams, pickedPersonas);
                return (
                  <li
                    key={task.id}
                    className={`border-b-(length:--hairline) border-line transition-opacity duration-150 ease-out last:border-b-0 ${offTeam ? DIMMED : ''}`}
                  >
                    <TaskRow
                      personas={personas}
                      pickedTeams={teams}
                      pickedPersonas={pickedPersonas}
                      faded={offTeam}
                      task={task}
                      open={openTasks.has(task.id)}
                      openItems={openTasks}
                      // Already faded as a whole, so a light filter doesn't fade it twice.
                      dim={offTeam ? null : dim}
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
                );
              })}
            </ol>
          )}
          <div className="mt-1 flex min-h-10 items-center">
            <AddControl
              action="Add task"
              label={`New task in ${activity.name}`}
              placeholder="Task name"
              startOpen={startAdding}
              variant="quiet"
              buttonClassName="-ms-2"
              fieldClassName="py-2 text-base leading-[1.35] lg:text-[15px]"
              onAdd={onAddTask}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
