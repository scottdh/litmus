'use client';
import { LightMark } from './light-mark';
import { LIGHT_COPY, MARK_COLOUR } from './lights';
import { NameField } from './name-field';
import type { Subject } from './subject';

const LABEL: Record<Subject['kind'], string> = { chapter: 'Chapter name', task: 'Task name', subtask: 'Subtask name' };

/** Sits beside the story rather than over it, so the map and its controls stay usable. On a phone it fills the screen. */
export function Drawer({
  subject,
  onDraft,
  onSave,
  onClose,
}: {
  subject: Subject;
  onDraft: (name: string) => void;
  onSave: (name: string) => void;
  onClose: () => void;
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
      {subject.kind !== 'chapter' && (
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-0.5 text-[14px] leading-snug">
          <span className={MARK_COLOUR[subject.light]}>
            <LightMark light={subject.light} />
          </span>
          <span>{LIGHT_COPY[subject.light].label}</span>
          <span className="col-start-2 text-pretty text-muted">
            {LIGHT_COPY[subject.light].meaning}
            {subject.lightFollowsSubtasks && ' Set by its subtasks.'}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={onClose}
        className="relative mt-2 h-8 cursor-pointer rounded-sm px-2 text-[13px] font-medium shadow-raised transition-transform duration-150 ease-out before:absolute before:inset-x-0 before:-inset-y-1.5 active:scale-[0.96]"
      >
        Done
      </button>
    </aside>
  );
}
