import {
  addChapter,
  addTaskToMap,
  getMapView,
  invariantViolation,
  moveTask,
  rateTask,
  renameChapter,
  renameTaskInMap,
  undoMove,
  type AddDestination,
  type Clock,
  type Instant,
  type Light,
  type MapId,
  type MapRecord,
  type MapRepository,
  type MoveDestination,
  type TaskId,
} from '@litmus/core';
import { SAMPLE_MAP_ID, createSampleMapRepository } from '@litmus/core/in-memory';

// Kept on globalThis so a dev reload of this module doesn't lose changes. They last until the server restarts.
const store = globalThis as typeof globalThis & {
  litmusMaps?: MapRepository;
  litmusLastMove?: { token: string; mapId: MapId; before: MapRecord; after: MapRecord };
};
const maps = (store.litmusMaps ??= createSampleMapRepository());

const clock: Clock = { now: () => new Date().toISOString() as Instant };

/** `isSample` is shown on screen, so an in-memory page can't pass as finished. */
export async function loadMap() {
  const map = await getMapView({ maps })(SAMPLE_MAP_ID);
  return { map, isSample: true };
}

export async function renameOnMap({
  mapId,
  kind,
  id,
  name,
}: {
  mapId: string;
  kind: 'chapter' | 'task';
  id: string;
  name: string;
}) {
  if (kind === 'chapter') await renameChapter({ maps })({ mapId: mapId as MapId, activityId: id, name });
  else await renameTaskInMap({ maps })({ mapId: mapId as MapId, taskId: id as TaskId, name });
}

export async function rateOnMap({ mapId, id, light, note }: { mapId: string; id: string; light: Light; note: string }) {
  await rateTask({ maps, clock })({ mapId: mapId as MapId, taskId: id as TaskId, light, note });
}

export async function moveOnMap({ mapId, id, to }: { mapId: string; id: string; to: MoveDestination }) {
  const { before, after } = await moveTask({ maps })({ mapId: mapId as MapId, taskId: id as TaskId, to });
  return remember(mapId as MapId, before, after);
}

const newId = () => crypto.randomUUID();

function remember(mapId: MapId, before: MapRecord, after: MapRecord) {
  const token = crypto.randomUUID();
  store.litmusLastMove = { token, mapId, before, after };
  return token;
}

export async function addTaskOnMap({ mapId, name, to }: { mapId: string; name: string; to: AddDestination }) {
  const { id, before, after } = await addTaskToMap({ maps, newId })({ mapId: mapId as MapId, name, to });
  return { id, undoToken: remember(mapId as MapId, before, after) };
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

/** Only the latest move or add can be undone. */
export async function undoMoveOnMap(token: string) {
  const last = store.litmusLastMove;
  if (last?.token !== token) throw invariantViolation('UNDO_OUT_OF_DATE', 'That move can no longer be undone.');
  await undoMove({ maps })({ mapId: last.mapId, before: last.before, after: last.after });
  delete store.litmusLastMove;
}
