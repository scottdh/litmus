'use client';
import type { MapView } from '@litmus/core';
import { AddControl } from './add-field';
import { BUTTON } from './button-style';
import { LightMark } from './light-mark';
import { LIGHT_COPY, MARK_COLOUR } from './lights';
import type { Destination } from './drop';
import { MoveArrows, MoveTo } from './move-section';
import { NameField } from './name-field';
import { NoteField } from './note-field';
import { RatingSection, type ReviewDraft } from './rating-section';
import type { Rate, RenameResult } from './rename-result';
import { StepMark } from './step-mark';
import type { Subject } from './subject';

const LABEL: Record<Subject['kind'], string> = {
  chapter: 'Chapter name',
  task: 'Task name',
  subtask: 'Subtask name',
  step: 'Step name',
};

/** Runs the full height of the window, with the page making room so the map and its controls stay usable. On a phone it fills the screen. */
export function Drawer({
  map,
  onMove,
  mapId,
  rate,
  reviewDraft,
  onReviewDraft,
  onOpenChild,
  subject,
  onDraft,
  onSave,
  onClose,
  onAddSubtask,
  onAddStep,
  onNote,
  onAddChapter,
}: {
  map: MapView;
  onMove: (to: Destination) => void;
  mapId: string;
  rate: Rate;
  reviewDraft: ReviewDraft | null;
  onReviewDraft: (draft: ReviewDraft | null) => void;
  onOpenChild: (id: string) => void;
  subject: Subject;
  onDraft: (name: string) => void;
  onSave: (name: string) => void;
  onClose: () => void;
  onAddSubtask: (name: string) => void;
  onAddStep: (name: string) => void;
  onNote: (note: string) => Promise<RenameResult>;
  onAddChapter: (where: 'before' | 'after') => void;
}) {
  return (
    <aside
      aria-label={`Details of ${subject.name}`}
      className="fixed inset-y-0 right-0 z-10 flex w-full flex-col items-start gap-4 overflow-y-auto bg-surface p-6 shadow-raised lg:w-96 starting:translate-x-full [transition:translate_var(--motion-focus)]"
    >
      {/* Stays in view, because a long review can push the rest of the drawer off screen. */}
      <div className="sticky -top-6 z-1 -mx-6 -mt-6 -mb-2 flex w-[calc(100%+3rem)] items-start justify-between gap-2 bg-surface px-6 pt-6 pb-2">
        <p className="text-[13px] leading-snug text-pretty text-muted">{subject.path}</p>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="relative -me-1.5 -mt-1.5 grid size-8 shrink-0 cursor-pointer place-items-center rounded-sm text-muted transition-[color,scale] duration-150 ease-out before:absolute before:-inset-1.5 hover:text-ink active:scale-[0.96]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
          </svg>
        </button>
      </div>
      <div
        className={`w-full ${subject.kind === 'chapter' ? 'font-story text-[28px] leading-[1.1] tracking-[-0.01em]' : 'text-[20px] leading-[1.3]'}`}
      >
        {/* Keyed, so switching to another row starts from that row's name. */}
        <NameField
          key={subject.id}
          value={subject.name}
          label={LABEL[subject.kind]}
          selectOnFocus={subject.kind === 'chapter'}
          onDraft={onDraft}
          onSave={onSave}
          onFinish={onClose}
        />
      </div>
      {subject.kind === 'step' && (
        <>
          <NoteField key={`note-${subject.id}`} id={subject.id} value={subject.note} onSave={onNote} />
          <div className="flex max-lg:w-24">
            <MoveArrows map={map} id={subject.id} onMove={onMove} />
          </div>
        </>
      )}
      {(subject.kind === 'task' || subject.kind === 'subtask') && subject.subtasks.length === 0 && (
        <RatingSection
          key={subject.id}
          mapId={mapId}
          id={subject.id}
          light={subject.light}
          review={subject.review}
          draft={reviewDraft}
          rate={rate}
          onDraft={onReviewDraft}
          beside={<MoveArrows map={map} id={subject.id} onMove={onMove} />}
        />
      )}
      {(subject.kind === 'task' || subject.kind === 'subtask') && subject.subtasks.length > 0 && (
        <div className="flex w-full flex-col gap-2 text-[14px] leading-snug">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2">
              <span className={MARK_COLOUR[subject.light]}>
                <LightMark light={subject.light} />
              </span>
              {LIGHT_COPY[subject.light].label}
            </p>
            <div className="flex max-lg:w-24">
              <MoveArrows map={map} id={subject.id} onMove={onMove} />
            </div>
          </div>
          <p className="text-[13px] text-pretty text-muted">Set by its subtasks.</p>
          <ul>
            {subject.subtasks.map((sub) => (
              <li key={sub.id}>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChild(sub.id);
                  }}
                  className="group/row flex min-h-9 w-full cursor-pointer items-start gap-2 py-2 text-left text-pretty max-lg:min-h-11"
                >
                  <span className={`pt-1 ${MARK_COLOUR[sub.light]}`}>
                    <LightMark light={sub.light} className="size-3" />
                    <span className="sr-only">{LIGHT_COPY[sub.light].label}: </span>
                  </span>
                  <span className="underline decoration-transparent decoration-from-font underline-offset-2 transition-[text-decoration-color] duration-150 ease-out group-hover/row:decoration-current">
                    {sub.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {subject.earlierReview !== null && (
            <div className="mt-2 flex flex-col gap-1">
              <p className="text-[13px] text-pretty text-muted">
                Earlier review, from before it had subtasks. It no longer sets the colour.
              </p>
              <p className="text-pretty whitespace-pre-wrap text-muted">{subject.earlierReview}</p>
            </div>
          )}
        </div>
      )}
      {subject.kind === 'task' && (
        <AddControl
          key={`add-${subject.id}`}
          action="Add subtask"
          label={`New subtask of ${subject.name}`}
          placeholder="Subtask name"
          buttonClassName="shadow-raised"
          fieldClassName="py-1 text-base leading-[1.35] lg:text-[14px]"
          onAdd={onAddSubtask}
        />
      )}
      {subject.kind === 'subtask' && (
        <>
          {subject.steps.length > 0 && (
            <ol aria-label="Steps" className="w-full border-t-(length:--hairline) border-line pt-2">
              {subject.steps.map((step) => (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChild(step.id);
                    }}
                    className="group/row flex min-h-9 w-full cursor-pointer items-start gap-2 py-2 text-left text-[14px] leading-snug text-pretty max-lg:min-h-11"
                  >
                    <StepMark />
                    <span className="underline decoration-transparent decoration-from-font underline-offset-2 transition-[text-decoration-color] duration-150 ease-out group-hover/row:decoration-current">
                      {step.name}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
          <AddControl
            key={`add-${subject.id}`}
            action="Add step"
            label={`New step of ${subject.name}`}
            placeholder="Step name"
            buttonClassName="shadow-raised"
            fieldClassName="py-1 text-base leading-[1.35] lg:text-[14px]"
            onAdd={onAddStep}
          />
        </>
      )}
      {subject.kind === 'chapter' && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              onAddChapter('before');
            }}
            className={`${BUTTON} shadow-raised`}
          >
            Add chapter before
          </button>
          <button
            type="button"
            onClick={() => {
              onAddChapter('after');
            }}
            className={`${BUTTON} shadow-raised`}
          >
            Add chapter after
          </button>
        </div>
      )}
      {subject.kind !== 'chapter' && <MoveTo map={map} id={subject.id} onMove={onMove} />}
    </aside>
  );
}
