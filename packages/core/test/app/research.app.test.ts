import { describe, expect, it } from 'vitest';
import {
  getMapView,
  type MapId,
  type PersonaId,
  type ProductId,
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
    {
      text: 'Counts drift.',
      quotes: [
        { text: 'I just walk over and look.', personaId: MECHANIC, participant: 'P3, mechanic' },
        { text: 'The screen said four.', personaId: 'ps_gone' as PersonaId, participant: 'P5, mechanic' },
      ],
    },
    { text: 'Nobody hears when a part arrives.', quotes: [] },
  ],
  hearing: [{ text: 'No idea who said this.', participant: 'P9' }],
  ideas: ['Show how fresh a count is.'],
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

  it('holds each quote under the pain point it illustrates, in the order they were written', async () => {
    const view = await getMapView({ maps })(MAP_ID);
    const research = view.activities[0]?.tasks[0]?.research;
    expect(research?.pains.map((pain) => [pain.text, pain.quotes.map((quote) => quote.text)])).toEqual([
      ['Counts drift.', ['I just walk over and look.', 'The screen said four.']],
      ['Nobody hears when a part arrives.', []],
    ]);
    expect(research?.ideas).toEqual(['Show how fresh a count is.']);
  });

  it('keeps only the quotes not yet placed under a pain point in what we’re hearing', async () => {
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.activities[0]?.tasks[0]?.research?.hearing).toEqual([
      { text: 'No idea who said this.', personaId: null, participant: 'P9' },
    ]);
  });

  it('names a quote’s persona only while that persona is on the map, wherever the quote sits', async () => {
    const view = await getMapView({ maps })(MAP_ID);
    expect(view.activities[0]?.tasks[0]?.research?.pains[0]?.quotes).toEqual([
      { text: 'I just walk over and look.', personaId: MECHANIC, participant: 'P3, mechanic' },
      { text: 'The screen said four.', personaId: null, participant: 'P5, mechanic' },
    ]);
  });

  it('gives the sample research both quotes under pain points and quotes not yet placed', async () => {
    const view = await getMapView({ maps: createSampleMapRepository() })(SAMPLE_MAP_ID);
    const all = view.activities.flatMap((activity) =>
      activity.tasks.flatMap((task) => [task.research, ...task.subtasks.map((sub) => sub.research)]),
    );
    expect(all.some((research) => research?.pains.some((pain) => pain.quotes.length > 0))).toBe(true);
    expect(all.some((research) => (research?.hearing.length ?? 0) > 0)).toBe(true);
  });
});
