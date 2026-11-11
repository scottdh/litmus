import { describe, expect, it } from 'vitest';
import {
  getMapView,
  type IdeaId,
  type MapId,
  type PainPointId,
  type PersonaId,
  type ProductId,
  type QuoteId,
  type Research,
  type StepId,
  type StoryMap,
  type TaskId,
} from '../../src/index.ts';
import {
  SAMPLE_MAP_ID,
  createInMemoryMapRepository,
  createSampleMapRepository,
} from '../../src/adapters/in-memory/index.ts';

const MAP_ID = 'map_1' as MapId;
const id = (value: string) => value as TaskId;
const MECHANIC = 'ps_mechanic' as PersonaId;

const research = (summary: string): Research => ({
  summary,
  pains: [
    { id: 'pain_1' as PainPointId, text: 'Counts drift.' },
    { id: 'pain_2' as PainPointId, text: 'Nobody hears when a part arrives.' },
  ],
  hearing: [
    { id: 'qt_1' as QuoteId, text: 'I just walk over and look.', personaId: MECHANIC, participant: 'P3, mechanic' },
    {
      id: 'qt_2' as QuoteId,
      text: 'The screen said four.',
      personaId: 'ps_gone' as PersonaId,
      participant: 'P5, mechanic',
    },
    { id: 'qt_3' as QuoteId, text: 'No idea who said this.', participant: 'P9' },
  ],
  ideas: [{ id: 'idea_1' as IdeaId, text: 'Show how fresh a count is.' }],
});

const map: StoryMap = {
  id: MAP_ID,
  name: 'A small map',
  teams: [],
  personas: [{ id: MECHANIC, name: 'Mechanic', icon: 'wrench' }],
  activities: [
    {
      id: 'act_1',
      name: 'First',
      tasks: [
        {
          id: id('tsk_parent'),
          name: 'Parent',
          research: research('About the parent.'),
          subtasks: [
            {
              id: id('tsk_sub'),
              name: 'Subtask',
              research: research('About the subtask.'),
              steps: [{ id: 'stp_1' as StepId, name: 'Step', note: '', research: research('About the step.') }],
            },
            { id: id('tsk_bare'), name: 'Bare', steps: [{ id: 'stp_2' as StepId, name: 'Bare step', note: '' }] },
          ],
        },
        { id: id('tsk_none'), name: 'No research', subtasks: [] },
      ],
    },
  ],
};

const maps = createInMemoryMapRepository([{ map, product: { id: 'prd_1' as ProductId, name: 'Thing' }, ratings: [] }]);

describe('research in the map view', () => {
  it('gives a task, a subtask and a step each their own, without rolling up', async () => {
    const view = await getMapView({ maps })(MAP_ID);
    const parent = view.activities[0]?.tasks[0];
    expect(parent?.research?.summary).toBe('About the parent.');
    expect(parent?.subtasks[0]?.research?.summary).toBe('About the subtask.');
    expect(parent?.subtasks[0]?.steps[0]?.research?.summary).toBe('About the step.');
  });

  it('is null where there is none, even under a parent that has some', async () => {
    const view = await getMapView({ maps })(MAP_ID);
    const tasks = view.activities[0]?.tasks;
    expect(tasks?.[1]?.research).toBeNull();
    expect(tasks?.[0]?.subtasks[1]?.research).toBeNull();
    expect(tasks?.[0]?.subtasks[1]?.steps[0]?.research).toBeNull();
  });

  it('holds pain points and ideas as flat lists, each with its id, in the order they were written', async () => {
    const view = await getMapView({ maps })(MAP_ID);
    const research = view.activities[0]?.tasks[0]?.research;
    expect(research?.pains).toEqual([
      { id: 'pain_1', text: 'Counts drift.' },
      { id: 'pain_2', text: 'Nobody hears when a part arrives.' },
    ]);
    expect(research?.ideas).toEqual([{ id: 'idea_1', text: 'Show how fresh a count is.' }]);
  });

  it('holds every quote in what we’re hearing, each with its id, naming its persona only while it’s on the map', async () => {
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.activities[0]?.tasks[0]?.research?.hearing).toEqual([
      { id: 'qt_1', text: 'I just walk over and look.', personaId: MECHANIC, participant: 'P3, mechanic' },
      { id: 'qt_2', text: 'The screen said four.', personaId: null, participant: 'P5, mechanic' },
      { id: 'qt_3', text: 'No idea who said this.', personaId: null, participant: 'P9' },
    ]);
  });

  it('keeps every invented sample quote, and gives every sample item an id of its own', async () => {
    const view = await getMapView({ maps: createSampleMapRepository() })(SAMPLE_MAP_ID);
    const all = view.activities
      .flatMap((activity) =>
        activity.tasks.flatMap((task) => [
          task.research,
          ...task.subtasks.flatMap((sub) => [sub.research, ...sub.steps.map((step) => step.research)]),
        ]),
      )
      .filter((research) => research !== null);
    expect(all.flatMap((research) => research.hearing)).toHaveLength(13);
    const ids = all.flatMap((research) =>
      [...research.pains, ...research.hearing, ...research.ideas].map((item) => item.id),
    );
    expect(ids.every((itemId) => itemId !== '')).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
