import { loadMap } from '../composition';
import { StoryWall } from '../features/map/story-wall';
import { renameAction } from './actions';

// The map can change, so it isn't prerendered.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { map, isSample } = await loadMap();
  return <StoryWall map={map} isSample={isSample} rename={renameAction} />;
}
