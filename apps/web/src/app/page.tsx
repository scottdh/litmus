import { loadMap } from '../composition';
import { StoryWall } from '../features/map/story-wall';
import {
  addChapterAction,
  addStepAction,
  addTaskAction,
  addPersonaAction,
  addTeamAction,
  assignTeamAction,
  removeTeamAction,
  moveAction,
  noteStepAction,
  rateAction,
  renameAction,
  setPersonaAction,
  setPersonaIconAction,
  undoChangeAction,
} from './actions';

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
      undoChange={undoChangeAction}
      addTask={addTaskAction}
      addStep={addStepAction}
      noteStep={noteStepAction}
      addChapter={addChapterAction}
      assignTeam={assignTeamAction}
      addTeam={addTeamAction}
      removeTeam={removeTeamAction}
      setPersona={setPersonaAction}
      addPersona={addPersonaAction}
      setPersonaIcon={setPersonaIconAction}
    />
  );
}
