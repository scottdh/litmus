import { describe, expect, it } from 'vitest';
import {
  editResearchInMap,
  undoChange,
  type IdeaId,
  type Instant,
  type MapId,
  type MapRepository,
  type PainPointId,
  type PersonaId,
  type ProductId,
  type QuoteId,
  type Research,
  type StepId,
  type TaskId,
} from '../../src/index.ts';
import { createInMemoryMapRepository } from '../../src/adapters/in-memory/index.ts';

const MAP_ID = 'map_1' as MapId;
const TASK = 'tsk_parent' as TaskId;
const SUBTASK = 'tsk_child' as TaskId;
const STEP = 'stp_1' as StepId;
const MECHANIC = 'ps_mechanic' as PersonaId;
const newId = () => 'new';

// Invented, never real.
const taskResearch = (): Research => ({
  summary: 'Finding out whether a part is on the shelf.',
  pains: [{ id: 'pain_1' as PainPointId, text: 'Counts drift.' }],
  hearing: [
    { id: 'qt_1' as QuoteId, text: 'I just walk over and look.', personaId: MECHANIC, participant: 'P1, mechanic' },
  ],
  ideas: [{ id: 'idea_1' as IdeaId, text: 'Show the last count’s date.' }],
});

function repository(): MapRepository {
  return createInMemoryMapRepository([
    {
      map: {
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
                id: TASK,
                name: 'Parent',
                research: taskResearch(),
                subtasks: [{ id: SUBTASK, name: 'Child', steps: [{ id: STEP, name: 'Step', note: '' }] }],
              },
            ],
          },
        ],
      },
      product: { id: 'prd_1' as ProductId, name: 'Thing' },
      ratings: [
        {
          subjectId: TASK,
          productId: 'prd_1' as ProductId,
          light: 'grey',
          evidence: [],
          ratedAt: '2026-01-01T00:00:00.000Z' as Instant,
        },
      ],
    },
  ]);
}

const record = async (maps: MapRepository) => {
  const found = await maps.find(MAP_ID);
  if (found === null) throw new Error('No map.');
  return found;
};

const researchOf = async (maps: MapRepository, id: string) => {
  const task = (await record(maps)).map.activities[0]?.tasks[0];
  const subtask = task?.subtasks[0];
  if (id === TASK) return task?.research;
  if (id === SUBTASK) return subtask?.research;
  return subtask?.steps[0]?.research;
};

const edit = (maps: MapRepository) => editResearchInMap({ maps, newId });

describe('editing research', () => {
  it('sets the summary, trimmed', async () => {
    const maps = repository();
    await edit(maps)({ mapId: MAP_ID, itemId: TASK, edit: { action: 'set-summary', text: '  Why it’s hard.  ' } });
    expect((await researchOf(maps, TASK))?.summary).toBe('Why it’s hard.');
  });

  it('keeps line breaks inside a summary', async () => {
    const maps = repository();
    await edit(maps)({ mapId: MAP_ID, itemId: TASK, edit: { action: 'set-summary', text: 'One.\n\nTwo.' } });
    expect((await researchOf(maps, TASK))?.summary).toBe('One.\n\nTwo.');
  });

  it('clears a summary set to nothing but space', async () => {
    const maps = repository();
    await edit(maps)({ mapId: MAP_ID, itemId: TASK, edit: { action: 'set-summary', text: '   ' } });
    expect((await researchOf(maps, TASK))?.summary).toBe('');
  });

  it('adds a pain point to the end, trimmed, and hands back its id', async () => {
    const maps = repository();
    const { id } = await edit(maps)({
      mapId: MAP_ID,
      itemId: TASK,
      edit: { action: 'add', list: 'pains', text: ' Parts go missing. ' },
    });
    expect(id).toBe('pain_new');
    expect((await researchOf(maps, TASK))?.pains).toEqual([
      { id: 'pain_1', text: 'Counts drift.' },
      { id: 'pain_new', text: 'Parts go missing.' },
    ]);
  });

  it('edits a pain point in place', async () => {
    const maps = repository();
    await edit(maps)({
      mapId: MAP_ID,
      itemId: TASK,
      edit: { action: 'edit', list: 'pains', id: 'pain_1', text: 'Counts drift weekly.' },
    });
    expect((await researchOf(maps, TASK))?.pains).toEqual([{ id: 'pain_1', text: 'Counts drift weekly.' }]);
  });

  it('removes a pain point', async () => {
    const maps = repository();
    await edit(maps)({ mapId: MAP_ID, itemId: TASK, edit: { action: 'remove', list: 'pains', id: 'pain_1' } });
    expect((await researchOf(maps, TASK))?.pains).toEqual([]);
  });

  it('adds, edits and removes an idea', async () => {
    const maps = repository();
    const { id } = await edit(maps)({
      mapId: MAP_ID,
      itemId: TASK,
      edit: { action: 'add', list: 'ideas', text: 'Scan.' },
    });
    expect(id).toBe('idea_new');
    await edit(maps)({
      mapId: MAP_ID,
      itemId: TASK,
      edit: { action: 'edit', list: 'ideas', id: 'idea_new', text: 'Scan it.' },
    });
    await edit(maps)({ mapId: MAP_ID, itemId: TASK, edit: { action: 'remove', list: 'ideas', id: 'idea_1' } });
    expect((await researchOf(maps, TASK))?.ideas).toEqual([{ id: 'idea_new', text: 'Scan it.' }]);
  });

  it('adds a quote to the end, with its words and participant trimmed', async () => {
    const maps = repository();
    const { id } = await edit(maps)({
      mapId: MAP_ID,
      itemId: TASK,
      edit: { action: 'add', list: 'hearing', quote: { text: ' It’s never there. ', participant: ' P2, desk ' } },
    });
    expect(id).toBe('qt_new');
    expect((await researchOf(maps, TASK))?.hearing[1]).toEqual({
      id: 'qt_new',
      text: 'It’s never there.',
      participant: 'P2, desk',
    });
  });

  it('keeps a quote’s persona when one is given', async () => {
    const maps = repository();
    await edit(maps)({
      mapId: MAP_ID,
      itemId: TASK,
      edit: {
        action: 'add',
        list: 'hearing',
        quote: { text: 'Words.', participant: 'P2, mechanic', personaId: MECHANIC },
      },
    });
    expect((await researchOf(maps, TASK))?.hearing[1]?.personaId).toBe(MECHANIC);
  });

  it('edits a quote in place, and can take its persona away', async () => {
    const maps = repository();
    await edit(maps)({
      mapId: MAP_ID,
      itemId: TASK,
      edit: { action: 'edit', list: 'hearing', id: 'qt_1', quote: { text: 'I look.', participant: 'P1, owner' } },
    });
    expect((await researchOf(maps, TASK))?.hearing).toEqual([
      { id: 'qt_1', text: 'I look.', participant: 'P1, owner' },
    ]);
  });

  it('removes a quote', async () => {
    const maps = repository();
    await edit(maps)({ mapId: MAP_ID, itemId: TASK, edit: { action: 'remove', list: 'hearing', id: 'qt_1' } });
    expect((await researchOf(maps, TASK))?.hearing).toEqual([]);
  });

  it('starts research on a subtask that has none, and leaves its parent’s alone', async () => {
    const maps = repository();
    await edit(maps)({ mapId: MAP_ID, itemId: SUBTASK, edit: { action: 'add', list: 'pains', text: 'Slow.' } });
    expect(await researchOf(maps, SUBTASK)).toEqual({
      summary: '',
      pains: [{ id: 'pain_new', text: 'Slow.' }],
      hearing: [],
      ideas: [],
    });
    expect(await researchOf(maps, TASK)).toEqual(taskResearch());
  });

  it('records research on a step', async () => {
    const maps = repository();
    await edit(maps)({ mapId: MAP_ID, itemId: STEP, edit: { action: 'set-summary', text: 'A step.' } });
    expect((await researchOf(maps, STEP))?.summary).toBe('A step.');
    expect(await researchOf(maps, SUBTASK)).toBeUndefined();
  });

  it('drops research that ends up with nothing in it, so the item reads as having none', async () => {
    const maps = repository();
    await edit(maps)({ mapId: MAP_ID, itemId: STEP, edit: { action: 'add', list: 'ideas', text: 'One.' } });
    await edit(maps)({ mapId: MAP_ID, itemId: STEP, edit: { action: 'remove', list: 'ideas', id: 'idea_new' } });
    expect(await researchOf(maps, STEP)).toBeUndefined();
  });

  it('never touches a light or its rating', async () => {
    const maps = repository();
    const { ratings } = await record(maps);
    await edit(maps)({ mapId: MAP_ID, itemId: TASK, edit: { action: 'remove', list: 'hearing', id: 'qt_1' } });
    await edit(maps)({ mapId: MAP_ID, itemId: TASK, edit: { action: 'set-summary', text: 'New.' } });
    expect((await record(maps)).ratings).toEqual(ratings);
  });

  it('hands back the before and after, so undoChange puts it back', async () => {
    const maps = repository();
    const original = await record(maps);
    const { before, after } = await edit(maps)({
      mapId: MAP_ID,
      itemId: TASK,
      edit: { action: 'remove', list: 'pains', id: 'pain_1' },
    });
    expect(before).toEqual(original);
    expect(after).toEqual(await record(maps));
    await undoChange({ maps })({ mapId: MAP_ID, before, after });
    expect(await record(maps)).toEqual(original);
  });

  describe('refuses', () => {
    const refused = async (input: Parameters<ReturnType<typeof edit>>[0], code: string) => {
      const maps = repository();
      const original = await record(maps);
      await expect(edit(maps)(input)).rejects.toMatchObject({ code });
      expect(await record(maps)).toEqual(original);
    };

    it('an unknown task, subtask or step', () =>
      refused({ mapId: MAP_ID, itemId: 'tsk_nope', edit: { action: 'set-summary', text: 'x' } }, 'ITEM_NOT_FOUND'));

    it('an unknown map', () =>
      refused(
        { mapId: 'map_nope' as MapId, itemId: TASK, edit: { action: 'set-summary', text: 'x' } },
        'MAP_NOT_FOUND',
      ));

    it('an unknown pain point, quote or idea', async () => {
      await refused(
        { mapId: MAP_ID, itemId: TASK, edit: { action: 'edit', list: 'pains', id: 'pain_nope', text: 'x' } },
        'RESEARCH_ITEM_NOT_FOUND',
      );
      await refused(
        { mapId: MAP_ID, itemId: TASK, edit: { action: 'remove', list: 'hearing', id: 'qt_nope' } },
        'RESEARCH_ITEM_NOT_FOUND',
      );
      await refused(
        { mapId: MAP_ID, itemId: TASK, edit: { action: 'remove', list: 'ideas', id: 'pain_1' } },
        'RESEARCH_ITEM_NOT_FOUND',
      );
    });

    it('an item named on a different task', () =>
      refused(
        { mapId: MAP_ID, itemId: SUBTASK, edit: { action: 'remove', list: 'pains', id: 'pain_1' } },
        'RESEARCH_ITEM_NOT_FOUND',
      ));

    it('an empty pain point or idea', async () => {
      await refused({ mapId: MAP_ID, itemId: TASK, edit: { action: 'add', list: 'pains', text: '  ' } }, 'TEXT_EMPTY');
      await refused(
        { mapId: MAP_ID, itemId: TASK, edit: { action: 'edit', list: 'ideas', id: 'idea_1', text: '\n' } },
        'TEXT_EMPTY',
      );
    });

    it('a quote with no words', () =>
      refused(
        {
          mapId: MAP_ID,
          itemId: TASK,
          edit: { action: 'add', list: 'hearing', quote: { text: ' ', participant: 'P2' } },
        },
        'TEXT_EMPTY',
      ));

    it('a quote with no participant', () =>
      refused(
        {
          mapId: MAP_ID,
          itemId: TASK,
          edit: { action: 'edit', list: 'hearing', id: 'qt_1', quote: { text: 'Hi.', participant: ' ' } },
        },
        'PARTICIPANT_EMPTY',
      ));

    it('a quote from a persona the map doesn’t have', () =>
      refused(
        {
          mapId: MAP_ID,
          itemId: TASK,
          edit: {
            action: 'add',
            list: 'hearing',
            quote: { text: 'Hi.', participant: 'P2', personaId: 'ps_nope' as PersonaId },
          },
        },
        'PERSONA_NOT_FOUND',
      ));
  });
});
