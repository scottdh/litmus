import { loadMap } from '../composition';
import { StoryWall } from '../features/map/story-wall';
import { addChapterAction, addTaskAction, moveAction, rateAction, renameAction, undoMoveAction } from './actions';

// The map can change, so it isn't prerendered.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { map, isSample } = await loadMap();
  return (
    <StoryWall
      map={map}
      isSample={isSample}
      rename={renameAction}
      rate={rateAction}
      move={moveAction}
      undoMove={undoMoveAction}
      addTask={addTaskAction}
      addChapter={addChapterAction}
    />
  );
}
