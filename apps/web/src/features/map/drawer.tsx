'use client';
import type { MapView } from '@litmus/core';
import { AddControl } from './add-field';
import { BUTTON } from './button-style';
import { LightMark } from './light-mark';
import { LIGHT_COPY, MARK_COLOUR } from './lights';
import type { Destination } from './drop';
import { MoveSection } from './move-section';
import { NameField } from './name-field';
import { RatingSection, type ReviewDraft } from './rating-section';
import type { Rate } from './rename-result';
import type { Subject } from './subject';

const LABEL: Record<Subject['kind'], string> = { chapter: 'Chapter name', task: 'Task name', subtask: 'Subtask name' };

/** Sits beside the story rather than over it, so the map and its controls stay usable. On a phone it fills the screen. */
export function Drawer({
  map,
  onMove,
  mapId,
  rate,
  reviewDraft,
  onReviewDraft,
  onOpenSubtask,
  subject,
  onDraft,
  onSave,
  onClose,
  onAddSubtask,
  onAddChapter,
}: {
  map: MapView;
  onMove: (to: Destination) => void;
  mapId: string;
  rate: Rate;
  reviewDraft: ReviewDraft | null;
  onReviewDraft: (draft: ReviewDraft | null) => void;
  onOpenSubtask: (id: string) => void;
  subject: Subject;
  onDraft: (name: string) => void;
  onSave: (name: string) => void;
  onClose: () => void;
  onAddSubtask: (name: string) => void;
  onAddChapter: (where: 'before' | 'after') => void;
}) {
  return (
    <aside
      aria-label={`Details of ${subject.name}`}
      className="flex flex-col items-start gap-4 bg-surface p-6 shadow-raised max-lg:fixed max-lg:inset-0 max-lg:z-10 max-lg:overflow-y-auto lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:w-96 lg:shrink-0 lg:self-start lg:overflow-y-auto lg:rounded-md starting:opacity-0 [transition:opacity_var(--motion-focus)]"
    >
      <p className="text-[13px] leading-snug text-pretty text-muted">{subject.path}</p>
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
      {subject.kind !== 'chapter' && subject.subtasks.length === 0 && (
        <RatingSection
          key={subject.id}
          mapId={mapId}
          id={subject.id}
          light={subject.light}
          review={subject.review}
          draft={reviewDraft}
          rate={rate}
          onDraft={onReviewDraft}
        />
      )}
      {subject.kind !== 'chapter' && subject.subtasks.length > 0 && (
        <div className="flex w-full flex-col gap-2 text-[14px] leading-snug">
          <p className="flex items-center gap-2">
            <span className={MARK_COLOUR[subject.light]}>
              <LightMark light={subject.light} />
            </span>
            {LIGHT_COPY[subject.light].label}
          </p>
          <p className="text-[13px] text-pretty text-muted">
            {LIGHT_COPY[subject.light].meaning} Set by its subtasks, so its reviews live on them.
          </p>
          <ul>
            {subject.subtasks.map((sub) => (
              <li key={sub.id}>
                <button
                  type="button"
                  onClick={() => {
                    onOpenSubtask(sub.id);
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
      {subject.kind !== 'chapter' && <MoveSection map={map} id={subject.id} onMove={onMove} />}
      <button type="button" onClick={onClose} className={`${BUTTON} mt-2 shadow-raised`}>
        Done
      </button>
    </aside>
  );
}
