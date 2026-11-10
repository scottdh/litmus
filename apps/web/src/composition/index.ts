import {
  addChapter,
  addStepToMap,
  addTaskToMap,
  addPersonaToMap,
  addTeamToMap,
  DomainError,
  getTaskView,
  assignTeamInMap,
  getMapView,
  invariantViolation,
  moveStepInMap,
  moveTask,
  rateTask,
  renameChapter,
  renameStepInMap,
  renameTaskInMap,
  removeTeamFromMap,
  removePersonaFromMap,
  renamePersonaInMap,
  renameTeamInMap,
  setPersonaIconInMap,
  setPersonaInMap,
  setStepNoteInMap,
  undoChange,
  type AddDestination,
  type Clock,
  type Instant,
  type Light,
  type MapId,
  type MapRecord,
  type MapRepository,
  type MoveDestination,
  type PersonaIcon,
  type PersonaId,
  type StepDestination,
  type StepId,
  type TaskId,
  type TeamId,
} from '@litmus/core';
import { SAMPLE_MAP_ID, createSampleMapRepository } from '@litmus/core/in-memory';

// Kept on globalThis so a dev reload of this module doesn't lose changes. They last until the server restarts.
const store = globalThis as typeof globalThis & {
  litmusMaps?: MapRepository;
  litmusLastChange?: { token: string; mapId: MapId; before: MapRecord; after: MapRecord };
};
const maps = (store.litmusMaps ??= createSampleMapRepository());

const clock: Clock = { now: () => new Date().toISOString() as Instant };

/** `isSample` is shown on screen, so an in-memory page can't pass as finished. */
export async function loadMap() {
  const map = await getMapView({ maps })(SAMPLE_MAP_ID);
  return { map, isSample: true };
}

/** Null when nothing on the map has this id, so the page can 404. */
export async function loadTaskView(id: string) {
  try {
    const page = await getTaskView({ maps })({ mapId: SAMPLE_MAP_ID, id });
    const map = await getMapView({ maps })(SAMPLE_MAP_ID);
    return { map, page };
  } catch (error) {
    if (error instanceof DomainError && error.code === 'TASK_NOT_FOUND') return null;
    throw error;
  }
}

export async function renameOnMap({
  mapId,
  kind,
  id,
  name,
}: {
  mapId: string;
  kind: 'chapter' | 'task' | 'step' | 'team' | 'persona';
  id: string;
  name: string;
}) {
  if (kind === 'chapter') await renameChapter({ maps })({ mapId: mapId as MapId, activityId: id, name });
  else if (kind === 'persona')
    await renamePersonaInMap({ maps })({ mapId: mapId as MapId, personaId: id as PersonaId, name });
  else if (kind === 'team') await renameTeamInMap({ maps })({ mapId: mapId as MapId, teamId: id as TeamId, name });
  else if (kind === 'step') await renameStepInMap({ maps })({ mapId: mapId as MapId, stepId: id as StepId, name });
  else await renameTaskInMap({ maps })({ mapId: mapId as MapId, taskId: id as TaskId, name });
}

export async function rateOnMap({ mapId, id, light, note }: { mapId: string; id: string; light: Light; note: string }) {
  await rateTask({ maps, clock })({ mapId: mapId as MapId, taskId: id as TaskId, light, note });
}

export async function moveOnMap({
  mapId,
  id,
  to,
}: {
  mapId: string;
  id: string;
  to: MoveDestination | StepDestination;
}) {
  const { before, after } =
    'subtaskId' in to
      ? await moveStepInMap({ maps })({ mapId: mapId as MapId, stepId: id as StepId, to })
      : await moveTask({ maps })({ mapId: mapId as MapId, taskId: id as TaskId, to });
  return remember(mapId as MapId, before, after);
}

const newId = () => crypto.randomUUID();

function remember(mapId: MapId, before: MapRecord, after: MapRecord) {
  const token = crypto.randomUUID();
  store.litmusLastChange = { token, mapId, before, after };
  return token;
}

export async function addTaskOnMap({
  mapId,
  name,
  to,
  teamId,
  personaId,
}: {
  mapId: string;
  name: string;
  to: AddDestination;
  teamId: string | null;
  personaId: string | null;
}) {
  const { id, before, after } = await addTaskToMap({ maps, newId })({
    mapId: mapId as MapId,
    name,
    to,
    teamId: teamId as TeamId | null,
    personaIds: personaId === null ? [] : [personaId as PersonaId],
  });
  return { id, undoToken: remember(mapId as MapId, before, after) };
}

export async function addStepOnMap({ mapId, name, subtaskId }: { mapId: string; name: string; subtaskId: string }) {
  const { id, before, after } = await addStepToMap({ maps, newId })({
    mapId: mapId as MapId,
    name,
    subtaskId: subtaskId as TaskId,
  });
  return { id, undoToken: remember(mapId as MapId, before, after) };
}

export async function setStepNoteOnMap({ mapId, id, note }: { mapId: string; id: string; note: string }) {
  await setStepNoteInMap({ maps })({ mapId: mapId as MapId, stepId: id as StepId, note });
}

export async function addChapterOnMap({
  mapId,
  name,
  before: place,
}: {
  mapId: string;
  name: string;
  before: string | null;
}) {
  const { id, before, after } = await addChapter({ maps, newId })({ mapId: mapId as MapId, name, before: place });
  return { id, undoToken: remember(mapId as MapId, before, after) };
}

export async function addPersonaOnMap({ mapId, name }: { mapId: string; name: string }) {
  const { id, before, after } = await addPersonaToMap({ maps, newId })({ mapId: mapId as MapId, name });
  return { id, undoToken: remember(mapId as MapId, before, after) };
}

export async function setPersonaIconOnMap({ mapId, id, icon }: { mapId: string; id: string; icon: PersonaIcon }) {
  await setPersonaIconInMap({ maps })({ mapId: mapId as MapId, personaId: id as PersonaId, icon });
}

export async function addTeamOnMap({ mapId, name }: { mapId: string; name: string }) {
  const { id, before, after } = await addTeamToMap({ maps, newId })({ mapId: mapId as MapId, name });
  return { id, undoToken: remember(mapId as MapId, before, after) };
}

export async function removeTeamOnMap({ mapId, teamId }: { mapId: string; teamId: string }) {
  const { before, after } = await removeTeamFromMap({ maps })({ mapId: mapId as MapId, teamId: teamId as TeamId });
  return { undoToken: remember(mapId as MapId, before, after) };
}

export async function removePersonaOnMap({ mapId, personaId }: { mapId: string; personaId: string }) {
  const { before, after } = await removePersonaFromMap({ maps })({
    mapId: mapId as MapId,
    personaId: personaId as PersonaId,
  });
  return { undoToken: remember(mapId as MapId, before, after) };
}

/** Only the latest move or add can be undone. */
export async function undoChangeOnMap(token: string) {
  const last = store.litmusLastChange;
  if (last?.token !== token) throw invariantViolation('UNDO_OUT_OF_DATE', 'That change can no longer be undone.');
  await undoChange({ maps })({ mapId: last.mapId, before: last.before, after: last.after });
  delete store.litmusLastChange;
}

export async function assignTeamOnMap({ mapId, id, teamId }: { mapId: string; id: string; teamId: string | null }) {
  await assignTeamInMap({ maps })({ mapId: mapId as MapId, taskId: id as TaskId, teamId: teamId as TeamId | null });
}

export async function setPersonaOnMap({
  mapId,
  id,
  personaId,
  on,
}: {
  mapId: string;
  id: string;
  personaId: string;
  on: boolean;
}) {
  await setPersonaInMap({ maps })({ mapId: mapId as MapId, itemId: id, personaId: personaId as PersonaId, on });
}
