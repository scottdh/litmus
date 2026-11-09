'use client';
import { Button } from '../../ui/button';
import type { Light, MapView, PersonaIcon } from '@litmus/core';
import type { ReactNode } from 'react';
import { AddControl } from './add-field';
import { LightMark } from './light-mark';
import { LIGHT_COPY, MARK_COLOUR } from './lights';
import type { Destination } from './drop';
import { MoveMenu } from './move-section';
import { NameField } from './name-field';
import { NoteField } from './note-field';
import { PersonaByline } from './persona-byline';
import { PersonaIconField } from './persona-icon-field';
import { PersonaName } from './persona-icon';
import { RemoveConfirm } from './remove-confirm';
import { removePersonaWarning } from './personas';
import { removeTeamWarning } from './teams';
import { RatingSection, type ReviewDraft } from './rating-section';
import { ResearchSection } from './research-section';
import type { Rate, RenameResult } from './rename-result';
import { StepMark } from './step-mark';
import { TeamLine } from './team-line';
import type { Subject } from './subject';

const LABEL: Record<Subject['kind'], string> = {
  chapter: 'Chapter name',
  task: 'Task name',
  subtask: 'Subtask name',
  step: 'Step name',
  team: 'Team name',
  persona: 'Persona name',
};

/** A row that opens a child or a task in the drawer. It dips from `surface` to `canvas` on hover, reaching 6 px past its text so nothing moves. */
function DrawerRow({ mark, onOpen, children }: { mark: ReactNode; onOpen: () => void; children: ReactNode }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="-mx-1.5 flex min-h-9 w-[calc(100%+0.75rem)] cursor-pointer items-start gap-2 rounded-sm px-1.5 py-2 text-left text-[14px] leading-snug text-pretty transition-colors duration-150 ease-out hover:bg-canvas max-lg:min-h-11"
      >
        {/* One line tall, so the mark centres on the first line however the name wraps. */}
        <span className="flex h-[1lh] shrink-0 items-center">{mark}</span>
        {children}
      </button>
    </li>
  );
}

function LightRowMark({ light }: { light: Light }) {
  return (
    <span className={MARK_COLOUR[light]}>
      <LightMark light={light} className="size-3" />
      <span className="sr-only">{LIGHT_COPY[light].label}: </span>
    </span>
  );
}

/** Runs the full height of the window, with the page making room so the map and its controls stay usable. On a phone it fills the screen. */
export function Drawer({
  map,
  onMove,
  mapId,
  rate,
  reviewDraft,
  onReviewDraft,
  onOpenChild,
  onOpenTask,
  subject,
  onDraft,
  onSave,
  onClose,
  onAddSubtask,
  onAddStep,
  onNote,
  onAddChapter,
  onAssignTeam,
  onRemove,
  removing,
  onSetPersona,
  onSetPersonaIcon,
}: {
  map: MapView;
  onMove: (to: Destination) => void;
  mapId: string;
  rate: Rate;
  reviewDraft: ReviewDraft | null;
  onReviewDraft: (draft: ReviewDraft | null) => void;
  onOpenChild: (id: string) => void;
  /** `parentId` is set for a subtask, so its row can be on show. */
  onOpenTask: (id: string, chapterId: string, parentId?: string) => void;
  subject: Subject;
  onDraft: (name: string) => void;
  onSave: (name: string) => void;
  onClose: () => void;
  onAddSubtask: (name: string) => void;
  onAddStep: (name: string) => void;
  onNote: (note: string) => Promise<RenameResult>;
  onAddChapter: (where: 'before' | 'after') => void;
  onAssignTeam: (teamId: string | null) => Promise<RenameResult>;
  onRemove: () => void;
  removing: boolean;
  onSetPersona: (personaId: string, on: boolean) => Promise<RenameResult>;
  onSetPersonaIcon: (icon: PersonaIcon) => Promise<RenameResult>;
}) {
  const isTask = subject.kind === 'task' || subject.kind === 'subtask';
  return (
    <aside
      aria-label={`Details of ${subject.name}`}
      className="fixed inset-y-0 right-0 z-10 flex w-full flex-col items-start gap-6 overflow-y-auto bg-surface p-6 shadow-raised lg:w-96 starting:translate-x-full [transition:translate_var(--motion-focus)]"
    >
      {/* Stays in view, because a long review can push the rest of the drawer off screen. */}
      <div className="sticky -top-6 z-1 -mx-6 -mt-6 -mb-4 flex w-[calc(100%+3rem)] items-start justify-between gap-2 bg-surface px-6 pt-6 pb-2">
        <p className="me-auto text-[13px] leading-snug text-pretty text-muted">{subject.path}</p>
        {(isTask || subject.kind === 'step') && <MoveMenu map={map} id={subject.id} onMove={onMove} />}
        <Button
          aria-label="Close"
          onClick={onClose}
          variant="quiet"
          shape="icon"
          className="-ms-1 -me-2 -mt-1.5 shrink-0 max-lg:-me-3.5 max-lg:-mt-3.5 max-lg:w-11 max-lg:flex-none"
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
        </Button>
      </div>

      {/* What it is. */}
      <div className="flex w-full flex-col gap-4">
        <div
          className={
            subject.kind === 'chapter'
              ? 'font-story text-[28px] leading-[1.1] tracking-[-0.01em]'
              : 'text-[20px] leading-[1.3]'
          }
        >
          {/* Keyed, so switching to another row starts from that row's name. */}
          <NameField
            key={subject.id}
            value={subject.name}
            label={LABEL[subject.kind]}
            selectOnFocus={subject.kind === 'chapter' || subject.kind === 'team' || subject.kind === 'persona'}
            onDraft={onDraft}
            onSave={onSave}
            onFinish={onClose}
          />
        </div>
        {(isTask || subject.kind === 'step') && map.personas.length > 0 && (
          <PersonaByline
            key={`personas-${subject.id}`}
            personas={map.personas}
            own={subject.kind === 'step' ? subject.personaIds : subject.ownPersonaIds}
            below={subject.kind === 'task' ? subject.subtasks : subject.kind === 'subtask' ? subject.steps : []}
            noun={subject.kind === 'task' ? 'subtasks' : 'steps'}
            onChange={onSetPersona}
          />
        )}
        {isTask && (
          <TeamLine
            key={`team-${subject.id}`}
            teams={map.teams}
            own={subject.ownTeamId}
            following={subject.kind === 'subtask' ? { teamId: subject.taskTeamId } : null}
            onChange={onAssignTeam}
            className={map.personas.length > 0 ? '-mt-3' : '-mt-2'}
          />
        )}
        {subject.kind === 'persona' && (
          <PersonaIconField key={`icon-${subject.id}`} icon={subject.icon} onChange={onSetPersonaIcon} />
        )}
      </div>

      {/* Its light or note. A light reads with the name, personas and team, so it sits closer than the 24 px between groups. */}
      {(isTask || subject.kind === 'step') && (
        <div className={`flex w-full flex-col items-start gap-4 ${isTask ? '-mt-2' : ''}`}>
          {subject.kind === 'step' && (
            <NoteField key={`note-${subject.id}`} id={subject.id} value={subject.note} onSave={onNote} />
          )}
          {isTask && subject.subtasks.length === 0 && (
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
          {isTask && subject.subtasks.length > 0 && (
            <div className="flex w-full flex-col gap-2 text-[14px] leading-snug">
              <p className="flex items-center gap-2">
                <span className={MARK_COLOUR[subject.light]}>
                  <LightMark light={subject.light} />
                </span>
                {LIGHT_COPY[subject.light].label}
              </p>
              <p className="text-[13px] text-pretty text-muted">Set by its subtasks.</p>
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
        </div>
      )}

      {/* What research says, then what's under it. */}
      {(isTask || subject.kind === 'step') && (
        <ResearchSection
          key={`research-${subject.id}`}
          research={subject.research}
          kind={subject.kind}
          personas={map.personas}
          under={
            isTask
              ? {
                  label: subject.kind === 'task' ? 'Subtasks' : 'Steps',
                  count: subject.kind === 'task' ? subject.subtasks.length : subject.steps.length,
                  content: (
                    <>
                      {subject.kind === 'task' && subject.subtasks.length > 0 && (
                        <ul aria-label="Subtasks" className="w-full">
                          {subject.subtasks.map((sub) => (
                            <DrawerRow
                              key={sub.id}
                              mark={<LightRowMark light={sub.light} />}
                              onOpen={() => {
                                onOpenChild(sub.id);
                              }}
                            >
                              <PersonaName name={sub.name} personas={map.personas} ids={sub.personaIds} />
                            </DrawerRow>
                          ))}
                        </ul>
                      )}
                      {subject.kind === 'subtask' && subject.steps.length > 0 && (
                        <ol aria-label="Steps" className="w-full">
                          {subject.steps.map((step) => (
                            <DrawerRow
                              key={step.id}
                              mark={<StepMark className="" />}
                              onOpen={() => {
                                onOpenChild(step.id);
                              }}
                            >
                              <PersonaName name={step.name} personas={map.personas} ids={step.personaIds} />
                            </DrawerRow>
                          ))}
                        </ol>
                      )}
                      <AddControl
                        key={`add-${subject.id}`}
                        action={subject.kind === 'task' ? 'Add subtask' : 'Add step'}
                        label={`New ${subject.kind === 'task' ? 'subtask' : 'step'} of ${subject.name}`}
                        placeholder={subject.kind === 'task' ? 'Subtask name' : 'Step name'}
                        variant="raised"
                        fieldClassName="py-1 text-base leading-[1.35] lg:text-[14px]"
                        onAdd={subject.kind === 'task' ? onAddSubtask : onAddStep}
                      />
                    </>
                  ),
                }
              : null
          }
        />
      )}

      {(subject.kind === 'team' || subject.kind === 'persona') &&
        (subject.chapters.length === 0 ? (
          <p className="text-[14px] leading-snug text-pretty text-muted">
            {subject.kind === 'team'
              ? `No tasks yet. Open a task and pick ${subject.name} as its team.`
              : `No tasks yet. Open a task and add ${subject.name} under its name.`}
          </p>
        ) : (
          <div className="flex w-full flex-col gap-4">
            {subject.chapters.map((chapter) => (
              <section key={chapter.id} aria-labelledby={`drawer-chapter-${chapter.id}`}>
                <h3 id={`drawer-chapter-${chapter.id}`} className="text-[13px] text-muted">
                  {chapter.name}
                </h3>
                <ul>
                  {chapter.tasks.map((task) => (
                    <DrawerRow
                      key={task.id}
                      mark={<LightRowMark light={task.light} />}
                      onOpen={() => {
                        onOpenTask(task.id, chapter.id, task.under?.id);
                      }}
                    >
                      <span>
                        {task.name}
                        {task.under && (
                          <span className="block text-[13px] text-muted">Subtask of {task.under.name}</span>
                        )}
                      </span>
                    </DrawerRow>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ))}
      {(subject.kind === 'team' || subject.kind === 'persona') && (
        <div className="flex w-full flex-col items-start gap-1.5 border-t-(length:--hairline) border-line pt-4">
          <RemoveConfirm
            label={subject.kind === 'team' ? 'Remove team' : 'Remove persona'}
            name={subject.name}
            warning={(subject.kind === 'team' ? removeTeamWarning : removePersonaWarning)(
              subject.chapters.reduce((count, chapter) => count + chapter.tasks.length, 0),
            )}
            removing={removing}
            onRemove={onRemove}
          />
          <p className="text-[13px] leading-snug text-pretty text-muted">
            {subject.kind === 'team'
              ? 'Its tasks stay on the map and lose their team.'
              : 'It comes off every task, subtask and step it’s on.'}
          </p>
        </div>
      )}
      {subject.kind === 'chapter' && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              onAddChapter('before');
            }}
            variant="raised"
          >
            Add chapter before
          </Button>
          <Button
            onClick={() => {
              onAddChapter('after');
            }}
            variant="raised"
          >
            Add chapter after
          </Button>
        </div>
      )}
    </aside>
  );
}
