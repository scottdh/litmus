import { loadMap } from '../composition';
import { StoryWall } from '../features/map/story-wall';

export default async function HomePage() {
  const { map, isSample } = await loadMap();
  return <StoryWall map={map} isSample={isSample} />;
}
