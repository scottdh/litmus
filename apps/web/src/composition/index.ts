import { getMapView } from '@litmus/core';
import { SAMPLE_MAP_ID, createSampleMapRepository } from '@litmus/core/in-memory';

/** `isSample` is shown on screen, so an in-memory page can't pass as finished. */
export async function loadMap() {
  const map = await getMapView({ maps: createSampleMapRepository() })(SAMPLE_MAP_ID);
  return { map, isSample: true };
}
