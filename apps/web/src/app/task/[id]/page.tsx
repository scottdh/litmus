import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadTaskView } from '../../../composition';
import { taskViewModel } from '../../../features/task-view/model';
import { TaskView } from '../../../features/task-view/task-view';
import { assignTeamAction, rateAction, setPersonaAction, undoChangeAction } from '../../actions';

// The map can change, so it isn't prerendered.
export const dynamic = 'force-dynamic';

async function load(id: string) {
  const loaded = await loadTaskView(id);
  return loaded === null ? null : taskViewModel(loaded.map, loaded.page);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const model = await load((await params).id);
  return model === null ? {} : { title: `${model.page.name} · ${model.mapName}` };
}

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const model = await load((await params).id);
  if (model === null) notFound();
  return (
    <TaskView
      model={model}
      rate={rateAction}
      undoChange={undoChangeAction}
      who={{ setPersona: setPersonaAction, assignTeam: assignTeamAction }}
    />
  );
}
