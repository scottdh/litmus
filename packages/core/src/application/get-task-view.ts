import type { Instant } from '../kernel/clock.ts';
import { notFound } from '../kernel/errors.ts';
import type { Light } from '../domain/map/light.ts';
import { deriveParentLight, replayParentLight } from '../domain/map/parent-light.ts';
import { byRatedAt, latestRatings, noteOf, type Rating } from '../domain/map/rating.ts';
import type { Activity, MapId, StoryMap, TaskId } from '../domain/map/story-map.ts';
import type { MapRepository } from './ports.ts';

export interface StoryPlace {
  id: string;
  name: string;
}

/** One change to a light. No author until there are accounts. */
export interface HistoryEntry {
  ratedAt: Instant;
  /** Grey before its first rating. The same as `to` when only the review changed. */
  from: Light;
  to: Light;
  note: string | null;
  /** The subtask whose rating moved a parent. Null for a task's or subtask's own rating. */
  cause: StoryPlace | null;
}

export interface TaskPageView {
  id: string;
  name: string;
  kind: 'task' | 'subtask' | 'step';
  chapter: { id: string; name: string; number: number };
  /** Above it in the story: its task for a subtask, its task and subtask for a step. */
  path: StoryPlace[];
  /** Either side in story order, among its siblings. */
  before: StoryPlace | null;
  after: StoryPlace | null;
  /** Null for a step, which takes no light. */
  light: Light | null;
  /** Newest first. Empty for a step, and for anything never rated. */
  history: HistoryEntry[];
}

interface Found {
  self: StoryPlace;
  kind: TaskPageView['kind'];
  activity: Activity;
  index: number;
  path: StoryPlace[];
  siblings: StoryPlace[];
  /** Its subtasks, when it's a task that has them. */
  subtasks: StoryPlace[];
}

const place = ({ id, name }: StoryPlace): StoryPlace => ({ id, name });

function find(map: StoryMap, id: string): (Found & { number: number }) | null {
  for (const [a, activity] of map.activities.entries()) {
    const at = (found: Omit<Found, 'activity'>) => ({ ...found, activity, number: a + 1 });
    for (const [t, task] of activity.tasks.entries()) {
      if (task.id === id)
        return at({
          self: place(task),
          kind: 'task',
          index: t,
          path: [],
          siblings: activity.tasks.map(place),
          subtasks: task.subtasks.map(place),
        });
      for (const [s, sub] of task.subtasks.entries()) {
        if (sub.id === id)
          return at({
            self: place(sub),
            kind: 'subtask',
            index: s,
            path: [place(task)],
            siblings: task.subtasks.map(place),
            subtasks: [],
          });
        const stepIndex = sub.steps.findIndex((step) => step.id === id);
        const step = sub.steps[stepIndex];
        if (step !== undefined)
          return at({
            self: place(step),
            kind: 'step',
            index: stepIndex,
            path: [place(task), place(sub)],
            siblings: sub.steps.map(place),
            subtasks: [],
          });
      }
    }
  }
  return null;
}

/** Oldest first. A task or subtask's own log. */
function ownHistory(log: Rating[]): HistoryEntry[] {
  let from: Light = 'grey';
  return log.map((rating) => {
    const entry = { ratedAt: rating.ratedAt, from, to: rating.light, note: noteOf(rating), cause: null };
    from = rating.light;
    return entry;
  });
}

/** Oldest first. Replayed from its subtasks, each entry naming the one that moved it. */
function parentHistory(subtasks: StoryPlace[], ratings: Rating[]): HistoryEntry[] {
  const byId = new Map(subtasks.map((sub) => [sub.id, sub]));
  return replayParentLight(
    subtasks.map((sub) => sub.id as TaskId),
    ratings,
  ).map(({ rating, from, to }) => ({
    ratedAt: rating.ratedAt,
    from,
    to,
    note: noteOf(rating),
    cause: byId.get(rating.subjectId) ?? null,
  }));
}

function lightAndHistory(found: Found, ratings: Rating[]): Pick<TaskPageView, 'light' | 'history'> {
  if (found.kind === 'step') return { light: null, history: [] };
  const latest = latestRatings(ratings);
  const lightOf = (id: string): Light => latest.get(id as TaskId)?.light ?? 'grey';
  if (found.subtasks.length > 0)
    return {
      light: deriveParentLight(found.subtasks.map((sub) => lightOf(sub.id))),
      history: parentHistory(found.subtasks, ratings).reverse(),
    };
  return {
    light: lightOf(found.self.id),
    history: ownHistory(byRatedAt(ratings.filter((rating) => rating.subjectId === found.self.id))).reverse(),
  };
}

/** What the task view needs from core, for a task, a subtask or a step. */
export const getTaskView =
  (deps: { maps: MapRepository }) =>
  async ({ mapId, id }: { mapId: MapId; id: string }): Promise<TaskPageView> => {
    const record = await deps.maps.find(mapId);
    if (record === null) throw notFound('MAP_NOT_FOUND', `No map with id ${mapId}.`);
    const found = find(record.map, id);
    if (found === null) throw notFound('TASK_NOT_FOUND', `No task, subtask or step with id ${id}.`);
    return {
      ...found.self,
      kind: found.kind,
      chapter: { id: found.activity.id, name: found.activity.name, number: found.number },
      path: found.path,
      before: found.siblings[found.index - 1] ?? null,
      after: found.siblings[found.index + 1] ?? null,
      ...lightAndHistory(found, record.ratings),
    };
  };
