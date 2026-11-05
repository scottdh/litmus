import {
  getMapView,
  rateTask,
  renameChapter,
  renameTaskInMap,
  type Clock,
  type Instant,
  type Light,
  type MapId,
  type MapRepository,
  type TaskId,
} from '@litmus/core';
import { SAMPLE_MAP_ID, createSampleMapRepository } from '@litmus/core/in-memory';

// Kept on globalThis so a dev reload of this module doesn't lose changes. They last until the server restarts.
const store = globalThis as typeof globalThis & { litmusMaps?: MapRepository };
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
