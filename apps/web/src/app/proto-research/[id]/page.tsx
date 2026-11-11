// PROTOTYPE (#104). Throwaway. The task view with three directions for recording research behind a picker.
import { notFound } from 'next/navigation';
import { loadTaskView } from '../../../composition';
import { taskViewModel } from '../../../features/task-view/model';
import { ProtoTaskView } from '../../../features/task-view/proto-research/shell';
import { assignTeamAction, rateAction, setPersonaAction, undoChangeAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function ProtoResearchPage({ params }: { params: Promise<{ id: string }> }) {
  const loaded = await loadTaskView((await params).id);
  const model = loaded === null ? null : taskViewModel(loaded.map, loaded.page);
  if (model === null) notFound();
  return (
    <ProtoTaskView
      model={model}
      rate={rateAction}
      undoChange={undoChangeAction}
      who={{ setPersona: setPersonaAction, assignTeam: assignTeamAction }}
    />
  );
}
