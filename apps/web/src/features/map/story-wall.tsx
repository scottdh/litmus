'use client';
import type { Light, MapView } from '@litmus/core';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AddField } from './add-field';
import { BUTTON } from './button-style';
import { Chapter } from './chapter';
import { Drawer } from './drawer';
import { describeDestination, type Destination } from './drop';
import { chapterState, focusSummary } from './focus';
import { KeyPopover } from './key-popover';
import { PersonaGlyph } from './persona-icon';
import { PersonaPopover } from './persona-popover';
import {
  chaptersWithPicks,
  personaChipLabel,
  personaForNewTask,
  personaSummary,
  type PickedPersonas,
} from './personas';
import { TeamPopover } from './team-popover';
import { NO_TEAM, isEveryTeam, teamChipLabel, teamForNewTask, type PickedTeams, teamSummary } from './teams';
import { LightMark } from './light-mark';
import { FILL_COLOUR, LIGHT_COPY } from './lights';
import type { ReviewDraft } from './rating-section';
import type {
  AddChapter,
  AddResult,
  AddStep,
  AddTask,
  AddTeam,
  AssignTeam,
  Move,
  NoteStep,
  Rate,
  RemoveTeam,
  Rename,
  SetPersona,
  UndoChange,
} from './rename-result';
import { isInPopover } from '../../ui/popover';
import { findSubject } from './subject';
import { useChapterFocus } from './use-chapter-focus';
import { useTaskDrag } from './use-task-drag';

const TEAM_NAMES = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

const CHAPTER_END = 'shrink-0 lg:border-l-(length:--hairline) lg:border-line lg:px-5 lg:first:border-l-0 lg:first:pl-0';

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
      tasks: activity.tasks.map((task) => ({
        ...apply(task),
        subtasks: task.subtasks.map((sub) => ({ ...apply(sub), steps: sub.steps.map(apply) })),
      })),
    })),
  };
}

export function StoryWall({
  map: savedMap,
  isSample,
  rename,
  rate,
  move,
  undoChange,
  addTask,
  addStep,
  noteStep,
  addChapter,
  assignTeam,
  addTeam,
  setPersona,
  removeTeam,
}: {
  map: MapView;
  isSample: boolean;
  rename: Rename;
  rate: Rate;
  move: Move;
  undoChange: UndoChange;
  addTask: AddTask;
  addStep: AddStep;
  noteStep: NoteStep;
  addChapter: AddChapter;
  assignTeam: AssignTeam;
  addTeam: AddTeam;
  setPersona: SetPersona;
  removeTeam: RemoveTeam;
}) {
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [dim, setDim] = useState<Light | null>(null);
  const [teams, setTeams] = useState<PickedTeams>(new Set());
  const [personas, setPersonas] = useState<PickedPersonas>(new Set());
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
    set: setFocus,
  } = useChapterFocus(savedMap.id, chapterIds, selectedId === null);
  const focusing = focus.length > 0;
  const expandAll = useRef<HTMLButtonElement>(null);
  const keyButton = useRef<HTMLButtonElement>(null);
  const teamsButton = useRef<HTMLButtonElement>(null);
  const personasButton = useRef<HTMLButtonElement>(null);
  const teamNames = [
    ...map.teams.filter((team) => teams.has(team.id)).map((team) => team.name),
    ...(teams.has(NO_TEAM) ? ['No team'] : []),
  ];
  const onlyNoTeam = teams.size === 1 && teams.has(NO_TEAM);
  // No team counts as one more pick, so picking it with every team is still everything.
  const pickableCount = map.teams.length + (teams.has(NO_TEAM) ? 1 : 0);
  const allTeams = isEveryTeam(teamNames.length, pickableCount);
  const teamsPhrase = allTeams ? 'any team' : TEAM_NAMES.format(teamNames);
  const pickedPersonas = map.personas.filter((persona) => personas.has(persona.id));
  const personaNames = pickedPersonas.map((persona) => persona.name);
  const picking = teams.size > 0 || personas.size > 0;
  const pickedChapters = chaptersWithPicks(map.activities, teams, personas);
  const summary =
    personas.size > 0
      ? personaSummary(
          { phrase: teamNames.length === 0 ? '' : teamsPhrase, onlyNoTeam },
          personaNames,
          pickedChapters.length > 0,
        )
      : teamNames.length === 0
        ? focusSummary(map.activities, focus)
        : teamSummary(
            {
              names: map.teams.filter((team) => teams.has(team.id)).map((team) => team.name),
              noTeam: teams.has(NO_TEAM),
              allTeams,
            },
            pickedChapters.length > 0,
          );

  const teamLabel = teamChipLabel(teamNames, pickableCount);
  const personaLabel = personaChipLabel(personaNames, map.personas.length);
  // Esc, or unfocusing every chapter, opens the whole story, so the picks that folded it go too.
  const picksFoldSomething = pickedChapters.length > 0;
  useEffect(() => {
    if (picking && focus.length === 0 && picksFoldSomething) {
      setTeams(new Set());
      setPersonas(new Set());
    }
  }, [focus.length, picking, picksFoldSomething]);

  // A team that's been removed can't stay picked.
  const hasRemovedPick = [...teams].some((id) => id !== NO_TEAM && !map.teams.some((team) => team.id === id));
  useEffect(() => {
    if (!hasRemovedPick) return;
    const next = new Set([...teams].filter((id) => id === NO_TEAM || map.teams.some((team) => team.id === id)));
    refold(next, personas);
  }, [hasRemovedPick]);

  /** Picking teams or personas folds away every chapter with nothing of theirs, by setting the focus. */
  const refold = (nextTeams: PickedTeams, nextPersonas: PickedPersonas) => {
    setTeams(nextTeams);
    setPersonas(nextPersonas);
    if (nextTeams.size === 0 && nextPersonas.size === 0) clear();
    else setFocus(chaptersWithPicks(map.activities, nextTeams, nextPersonas));
  };
  const flip = (picked: ReadonlySet<string>, id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };
  const found = selectedId === null ? null : findSubject(map, selectedId);
  // A chapter that's gone to the background has no tasks on show, so its drawer closes too.
  const subject =
    found && (found.kind === 'team' || focus.length === 0 || focus.includes(found.chapterId)) ? found : null;

  const [lastChange, setLastChange] = useState<{ token: string; message: string } | null>(null);
  const [changeProblem, setChangeProblem] = useState<string | null>(null);
  /** Where a new chapter's field is showing: in front of this chapter, or at the end if null. */
  const [newChapterBefore, setNewChapterBefore] = useState<string | null | undefined>(undefined);
  const [newChapterId, setNewChapterId] = useState<string | null>(null);
  const addChapterButton = useRef<HTMLButtonElement>(null);
  const addingChapter = newChapterBefore !== undefined;
  const newChapterIndex = !addingChapter
    ? -1
    : newChapterBefore === null
      ? map.activities.length
      : map.activities.findIndex((activity) => activity.id === newChapterBefore);

  // Once it's on the wall, a new chapter joins any focus, because it's what you're working on.
  const newChapterArrived = newChapterId !== null && chapterIds.includes(newChapterId);
  useEffect(() => {
    // Only when it arrives, so taking it back out of the focus afterwards sticks.
    if (newChapterArrived && focusing) toggleChapter(newChapterId);
  }, [newChapterArrived, newChapterId]);

  const report = (name: string, result: Promise<AddResult>, added: (id: string) => void) => {
    const failed = () => {
      setChangeProblem(`“${name}” couldn’t be added.`);
    };
    setChangeProblem(null);
    void result.then((outcome) => {
      if (!outcome.ok) {
        failed();
        return;
      }
      added(outcome.id);
      setLastChange({ token: outcome.undoToken, message: `Added ${name}.` });
    }, failed);
  };

  const moveTask = (id: string, to: Destination) => {
    const name = findSubject(map, id)?.name ?? '';
    setChangeProblem(null);
    void move({ mapId: savedMap.id, id, to }).then(
      (result) => {
        if (!result.ok) {
          setChangeProblem('That move didn’t work, so nothing changed.');
          return;
        }
        if ('parentId' in to) toggleTask(to.parentId, true);
        // So a moved step is on show, and its row is there to return focus to.
        if ('subtaskId' in to) {
          const parent = map.activities
            .flatMap((chapter) => chapter.tasks)
            .find((task) => task.subtasks.some((sub) => sub.id === to.subtaskId));
          if (parent) toggleTask(parent.id, true);
          toggleTask(to.subtaskId, true);
        }
        setLastChange({ token: result.undoToken, message: `Moved ${name} to ${describeDestination(map, to)}.` });
      },
      () => {
        setChangeProblem('That move didn’t work, so nothing changed.');
      },
    );
  };

  const [removingTeam, setRemovingTeam] = useState(false);
  const removeTeamNow = (id: string) => {
    // A second click before the first lands would fail, and contradict the first in the status line.
    if (removingTeam) return;
    const name = findSubject(map, id)?.name ?? '';
    const failed = () => {
      setChangeProblem(`${name} couldn’t be removed, so nothing changed.`);
    };
    setChangeProblem(null);
    setRemovingTeam(true);
    void removeTeam({ mapId: savedMap.id, id })
      .then((result) => {
        if (!result.ok) {
          failed();
          return;
        }
        setLastChange({ token: result.undoToken, message: `Removed ${name}.` });
        closeDrawer();
      }, failed)
      .finally(() => {
        setRemovingTeam(false);
      });
  };

  const undoLastChange = () => {
    if (lastChange === null) return;
    const { token } = lastChange;
    setLastChange(null);
    void undoChange(token).then(
      (result) => {
        setChangeProblem(result.ok ? null : 'That can’t be undone, because the map has changed since.');
      },
      () => {
        setChangeProblem('That can’t be undone, because the map has changed since.');
      },
    );
  };

  const { start: startDrag, dragging, indicator, ghost } = useTaskDrag(map, moveTask);

  const closeDrawer = useCallback(() => {
    setSelectedId((id) => {
      // A team was opened from the Teams popover, which has closed, so focus goes back to Teams.
      if (id !== null) (document.getElementById(`open-${id}`) ?? teamsButton.current)?.focus({ preventScroll: true });
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
      if (event.key === 'Escape' && !event.defaultPrevented && !isInPopover(event)) closeDrawer();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [drawerOpen, closeDrawer]);

  const dropDraft = (id: string) => {
    setDrafts((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== id)));
  };

  const saveName = (id: string, kind: 'chapter' | 'task' | 'step' | 'team', name: string) => {
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

  const newChapterField = addingChapter && (
    <section
      aria-label="New chapter"
      className="relative shrink-0 lg:w-68 lg:border-l-(length:--hairline) lg:border-line lg:px-5 lg:first:border-l-0 lg:first:pl-0"
    >
      <div className="lg:w-58">
        <p className="text-[13px] text-muted tabular-nums">Chapter {newChapterIndex + 1}</p>
        <div className="mt-1 font-story text-[28px] leading-[1.1] tracking-[-0.01em] lg:min-h-16">
          <AddField
            keepGoing={false}
            label="New chapter name"
            placeholder="Chapter name"
            onAdd={(name) => {
              report(name, addChapter({ mapId: savedMap.id, name, before: newChapterBefore ?? null }), setNewChapterId);
            }}
            onFinish={(byKey) => {
              setNewChapterBefore(undefined);
              if (byKey) addChapterButton.current?.focus({ preventScroll: true });
            }}
          />
        </div>
      </div>
    </section>
  );

  return (
    <main className={`mx-auto max-w-[1600px] px-4 pt-4 pb-16 ${subject ? 'lg:pe-100' : ''}`}>
      <div
        className={`mb-3 flex min-h-12 flex-wrap items-center gap-x-5 gap-y-2 border-b-(length:--hairline) border-line py-2 ${subject ? 'max-lg:invisible' : ''}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="text-[15px] leading-tight font-semibold text-balance">{map.name}</h1>
          {isSample && (
            <span className="shrink-0 rounded-sm bg-light-grey px-1.5 py-0.5 text-[12px] leading-none text-on-light-grey">
              Sample
            </span>
          )}
        </div>
        <p aria-live="polite" className="min-w-48 flex-1 text-[13px] leading-snug text-pretty text-muted">
          {[
            saveFailed ? 'That name couldn’t be saved, so the old one is back.' : '',
            changeProblem ?? '',
            lastChange?.message ?? '',
            summary,
            dim !== null ? `${LIGHT_COPY[dim].label}: ${LIGHT_COPY[dim].meaning}` : '',
          ]
            .filter(Boolean)
            .join(' ')}
        </p>
        <div className="ms-auto flex shrink-0 flex-wrap justify-end gap-2">
          {dim !== null && (
            <button
              type="button"
              onClick={() => {
                setDim(null);
                // This chip is about to disappear, so keyboard users need somewhere to land.
                keyButton.current?.focus();
              }}
              aria-label={`Stop dimming to ${LIGHT_COPY[dim].label.toLowerCase()}`}
              className={`${BUTTON} flex shrink-0 items-center gap-1.5 ${FILL_COLOUR[dim]}`}
            >
              <LightMark light={dim} className="size-3" />
              {LIGHT_COPY[dim].label} only
              <span aria-hidden="true" className="opacity-70">
                ×
              </span>
            </button>
          )}
          {teamNames.length > 0 && (
            <button
              type="button"
              onClick={() => {
                refold(new Set(), personas);
                // This chip is about to disappear, so keyboard users need somewhere to land.
                teamsButton.current?.focus();
              }}
              aria-label={allTeams ? 'Stop filtering by team' : `Stop showing only ${TEAM_NAMES.format(teamNames)}`}
              className={`${BUTTON} flex shrink-0 items-center gap-1.5 bg-ink text-canvas`}
            >
              {teamLabel}
              <span aria-hidden="true" className="opacity-70">
                ×
              </span>
            </button>
          )}
          {pickedPersonas.length > 0 && (
            <button
              type="button"
              onClick={() => {
                refold(teams, new Set());
                // This chip is about to disappear, so keyboard users need somewhere to land.
                personasButton.current?.focus();
              }}
              aria-label={
                personaLabel === 'All personas'
                  ? 'Stop filtering by persona'
                  : `Stop showing only ${TEAM_NAMES.format(personaNames)}`
              }
              className={`${BUTTON} flex shrink-0 items-center gap-1.5 bg-ink text-canvas`}
            >
              <span aria-hidden="true" className="flex gap-0.5">
                {pickedPersonas.map((persona) => (
                  <PersonaGlyph key={persona.id} icon={persona.icon} />
                ))}
              </span>
              {personaLabel}
              <span aria-hidden="true" className="opacity-70">
                ×
              </span>
            </button>
          )}
          <TeamPopover
            teams={map.teams}
            activities={map.activities}
            picked={teams}
            onToggle={(id) => {
              refold(flip(teams, id), personas);
            }}
            onOpen={openDrawer}
            onAdd={(name) => {
              report(name, addTeam({ mapId: savedMap.id, name }), () => undefined);
            }}
            triggerRef={teamsButton}
          />
          {map.personas.length > 0 && (
            <PersonaPopover
              personas={map.personas}
              activities={map.activities}
              picked={personas}
              onToggle={(id) => {
                refold(teams, flip(personas, id));
              }}
              triggerRef={personasButton}
            />
          )}
          <KeyPopover dim={dim} onDim={setDim} isSample={isSample} triggerRef={keyButton} />
          {lastChange && (
            <button type="button" onClick={undoLastChange} className={`${BUTTON} shrink-0 shadow-raised`}>
              Undo
            </button>
          )}
          {(focusing || picking) && (
            <button
              type="button"
              onClick={() => {
                clear();
                setTeams(new Set());
                setPersonas(new Set());
                // This button is about to disappear, so keyboard users need somewhere to land.
                expandAll.current?.focus();
              }}
              className={`${BUTTON} shrink-0 shadow-raised`}
            >
              Show the whole story
            </button>
          )}
          <button ref={expandAll} type="button" onClick={toggleAll} className={`${BUTTON} shrink-0 shadow-raised`}>
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      <div className="flex items-start">
        <div
          tabIndex={0}
          role="region"
          aria-label="The story, left to right"
          className={`flex min-w-0 grow flex-col lg:-ms-4 lg:flex-row lg:gap-0 lg:overflow-x-auto lg:ps-4 lg:pb-4 ${subject ? 'max-lg:invisible lg:me-0' : 'lg:-me-4 lg:pe-4'} ${focusing ? 'gap-5' : 'gap-10'}`}
        >
          {map.activities.map((activity, index) => (
            <Fragment key={activity.id}>
              {newChapterIndex === index && newChapterField}
              <Chapter
                activity={activity}
                position={index + 1 + (addingChapter && newChapterIndex <= index ? 1 : 0)}
                state={chapterState(focus, activity.id)}
                animate={animate}
                dim={dim}
                teams={teams}
                personas={map.personas}
                pickedPersonas={personas}
                openTasks={open}
                selectedId={subject?.id ?? null}
                draggingId={dragging?.id ?? null}
                onStartDrag={startDrag}
                onOpenDrawer={openDrawer}
                onToggleFocus={() => {
                  toggleChapter(activity.id);
                }}
                onToggleTask={toggleTask}
                startAdding={newChapterId === activity.id}
                onAddTask={(name) => {
                  report(
                    name,
                    addTask({
                      mapId: savedMap.id,
                      name,
                      to: { chapterId: activity.id },
                      teamId: teamForNewTask(teams),
                      personaId: personaForNewTask(personas),
                    }),
                    () => undefined,
                  );
                }}
              />
            </Fragment>
          ))}
          {newChapterIndex === map.activities.length && newChapterField}
          <div className={CHAPTER_END}>
            <button
              ref={addChapterButton}
              type="button"
              onClick={() => {
                setNewChapterBefore(null);
              }}
              className={`${BUTTON} shadow-raised`}
            >
              Add chapter
            </button>
          </div>
        </div>
        {subject && (
          <Drawer
            map={map}
            onMove={(to) => {
              moveTask(subject.id, to);
            }}
            mapId={savedMap.id}
            rate={rate}
            reviewDraft={reviewDrafts[subject.id] ?? null}
            onReviewDraft={(draft) => {
              setReviewDrafts((current) => {
                const rest = Object.fromEntries(Object.entries(current).filter(([key]) => key !== subject.id));
                return draft === null ? rest : { ...rest, [subject.id]: draft };
              });
            }}
            onOpenChild={(id) => {
              // So the child's row is on show, for its underline and to return focus to.
              toggleTask(subject.id, true);
              openDrawer(id);
            }}
            onOpenTask={(id, chapterId) => {
              // A team's task can sit in a folded chapter, which has no rows to show it.
              if (focusing && !focus.includes(chapterId)) toggleChapter(chapterId);
              openDrawer(id);
            }}
            subject={subject}
            onDraft={(name) => {
              setDrafts((current) => ({ ...current, [subject.id]: name }));
            }}
            onSave={(name) => {
              const kind = subject.kind === 'subtask' ? 'task' : subject.kind;
              saveName(subject.id, kind, name);
            }}
            onClose={closeDrawer}
            removingTeam={removingTeam}
            onRemoveTeam={() => {
              removeTeamNow(subject.id);
            }}
            onAssignTeam={(teamId) => assignTeam({ mapId: savedMap.id, id: subject.id, teamId })}
            onSetPersona={(personaId, on) => setPersona({ mapId: savedMap.id, id: subject.id, personaId, on })}
            onAddSubtask={(name) => {
              report(name, addTask({ mapId: savedMap.id, name, to: { parentId: subject.id } }), () => {
                toggleTask(subject.id, true);
              });
            }}
            onAddStep={(name) => {
              report(name, addStep({ mapId: savedMap.id, name, subtaskId: subject.id }), () => {
                toggleTask(subject.id, true);
              });
            }}
            onNote={(note) => noteStep({ mapId: savedMap.id, id: subject.id, note })}
            onAddChapter={(where) => {
              const index = map.activities.findIndex((activity) => activity.id === subject.id);
              setSelectedId(null);
              setNewChapterBefore(where === 'before' ? subject.id : (map.activities[index + 1]?.id ?? null));
            }}
          />
        )}
      </div>
      {dragging && (
        <div
          ref={ghost}
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-20 max-w-60 truncate rounded-sm bg-surface px-2 py-1 text-[13px] shadow-raised"
        >
          {dragging.name}
        </div>
      )}
      {indicator && (
        <div
          aria-hidden="true"
          style={{
            left: indicator.left,
            top: indicator.top,
            width: indicator.width,
            height: indicator.height,
          }}
          className={`pointer-events-none fixed z-20 rounded-sm ${indicator.kind === 'line' ? 'bg-ink' : 'outline-2 outline-ink'}`}
        />
      )}
    </main>
  );
}
