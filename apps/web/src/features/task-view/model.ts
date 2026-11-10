import type {
  HistoryEntry,
  Instant,
  Light,
  LightCount,
  MapView,
  PersonaView,
  QuoteView,
  StoryPlace,
  TaskPageView,
  TeamView,
} from '@litmus/core';
import { LIGHT_COPY } from '../map/lights';
import { findSubject } from '../map/subject';
import type { Following } from '../map/teams';

export interface OutlineStep {
  id: string;
  name: string;
  current: boolean;
}

export interface OutlineSubtask {
  id: string;
  name: string;
  light: Light;
  current: boolean;
  /** Empty unless this subtask holds the page. */
  steps: OutlineStep[];
}

export interface OutlineTask {
  id: string;
  name: string;
  light: Light;
  current: boolean;
  /** Empty unless this task holds the page. */
  subtasks: OutlineSubtask[];
}

export interface OutlineChapter {
  id: string;
  number: number;
  name: string;
  /** Holds the page. */
  open: boolean;
  tasks: OutlineTask[];
}

/** Every chapter, with only the branch holding the page opened down to subtasks and steps. */
export function outlineFor(map: MapView, id: string): OutlineChapter[] {
  return map.activities.map((chapter, index) => {
    const tasks = chapter.tasks.map((task): OutlineTask => {
      const holds =
        task.id === id || task.subtasks.some((sub) => sub.id === id || sub.steps.some((step) => step.id === id));
      return {
        id: task.id,
        name: task.name,
        light: task.light,
        current: task.id === id,
        subtasks: holds
          ? task.subtasks.map((sub) => {
              const holdsStep = sub.id === id || sub.steps.some((step) => step.id === id);
              return {
                id: sub.id,
                name: sub.name,
                light: sub.light,
                current: sub.id === id,
                steps: holdsStep
                  ? sub.steps.map((step) => ({ id: step.id, name: step.name, current: step.id === id }))
                  : [],
              };
            })
          : [],
      };
    });
    return {
      id: chapter.id,
      number: index + 1,
      name: chapter.name,
      open: tasks.some((task) => task.current || task.subtasks.length > 0),
      tasks,
    };
  });
}

export interface HistoryLine {
  key: string;
  /** Null for the add, which isn't dated until the map keeps when things were added. */
  ratedAt: Instant | null;
  light: Light;
  move: string;
  note: string | null;
  cause: StoryPlace | null;
}

/** Out of scope is neither better nor worse than a light, so it has no rank. */
const RANK: Partial<Record<Light, number>> = { grey: 0, red: 1, yellow: 2, green: 3 };
const label = (light: Light) => LIGHT_COPY[light].label;

/** "Red, down from yellow", "Yellow, up from red", "Review updated". */
function describeMove(from: Light, to: Light): string {
  if (from === to) return 'Review updated';
  const was = RANK[from];
  const now = RANK[to];
  const direction = was === undefined || now === undefined ? 'from' : now > was ? 'up from' : 'down from';
  return `${label(to)}, ${direction} ${label(from).toLowerCase()}`;
}

/** Newest first, as given, ending with the add. Empty for a step, which takes no light. */
export function historyLines(light: Light | null, history: HistoryEntry[]): HistoryLine[] {
  if (light === null) return [];
  return [
    ...history.map((change, index) => ({
      key: `${change.ratedAt}-${String(index)}`,
      ratedAt: change.ratedAt,
      light: change.to,
      move: describeMove(change.from, change.to),
      note: change.note,
      cause: change.cause,
    })),
    { key: 'added', ratedAt: null, light: 'grey', move: 'Added, grey', note: null, cause: null },
  ];
}

// UTC, so the server and the browser agree on the day.
const DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export const formatDay = (at: Instant) => DAY.format(new Date(at));

export interface ChildRow {
  id: string;
  name: string;
  /** Null for a step. */
  light: Light | null;
}

/** Everything the page shows, from the task view query and the map. */
export interface TaskViewModel {
  page: TaskPageView;
  mapId: string;
  mapName: string;
  /** A task or subtask without subtasks. A parent's light follows its subtasks, and a step has none. */
  rateable: boolean;
  outline: OutlineChapter[];
  /** Every persona on the map, for the quotes and the persona checklist. */
  allPersonas: PersonaView[];
  /** What the persona checklist starts from: those set here, and those set on its subtasks or steps. */
  who: { own: string[]; below: { name: string; personaIds: string[] }[]; noun: 'subtasks' | 'steps' };
  teams: TeamView[];
  /** What the team list starts from. Null for a step, which takes no team. */
  team: { own: string | null; following: Following } | null;
  /** A leaf's latest review. */
  review: string | null;
  /** A parent's subtasks by light. Empty for anything else. */
  mix: LightCount[];
  summary: string | null;
  pains: { text: string; quotes: QuoteView[] }[];
  /** Quotes not yet placed under a pain point. */
  loose: QuoteView[];
  ideas: string[];
  /** Its subtasks or steps. */
  children: ChildRow[];
  history: HistoryLine[];
}

export function taskViewModel(map: MapView, page: TaskPageView): TaskViewModel | null {
  const subject = findSubject(map, page.id);
  if (subject === null || (subject.kind !== 'task' && subject.kind !== 'subtask' && subject.kind !== 'step'))
    return null;
  const research = subject.research;
  const isTask = subject.kind !== 'step';
  const mix = map.activities.flatMap((chapter) => chapter.tasks).find((task) => task.id === page.id)?.mix ?? [];
  return {
    page,
    mapId: map.id,
    mapName: map.name,
    rateable: isTask && subject.subtasks.length === 0,
    outline: outlineFor(map, page.id),
    allPersonas: map.personas,
    who: {
      own: subject.kind === 'step' ? subject.personaIds : subject.ownPersonaIds,
      below: (subject.kind === 'task' ? subject.subtasks : subject.kind === 'subtask' ? subject.steps : []).map(
        (child) => ({ name: child.name, personaIds: child.personaIds }),
      ),
      noun: subject.kind === 'task' ? 'subtasks' : 'steps',
    },
    teams: map.teams,
    team: isTask
      ? { own: subject.ownTeamId, following: subject.kind === 'subtask' ? { teamId: subject.taskTeamId } : null }
      : null,
    review: isTask && subject.subtasks.length === 0 ? subject.review : null,
    mix: isTask && subject.subtasks.length > 0 ? mix : [],
    summary: research?.summary.trim() ? research.summary.trim() : null,
    pains: research?.pains ?? [],
    loose: research?.hearing ?? [],
    ideas: research?.ideas ?? [],
    children:
      subject.kind === 'step'
        ? []
        : subject.kind === 'task'
          ? subject.subtasks.map((sub) => ({ id: sub.id, name: sub.name, light: sub.light }))
          : subject.steps.map((step) => ({ id: step.id, name: step.name, light: null })),
    history: historyLines(page.light, page.history),
  };
}
