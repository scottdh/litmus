import { describe, expect, it } from 'vitest';
import {
  DomainError,
  addPersonaToMap,
  addTaskToMap,
  getMapView,
  renamePersonaInMap,
  setPersonaIconInMap,
  setPersonaInMap,
  undoChange,
  type MapId,
  type MapRepository,
  type PersonaId,
  type ProductId,
  type StepId,
  type TaskId,
} from '../../src/index.ts';
import {
  SAMPLE_MAP_ID,
  createInMemoryMapRepository,
  createSampleMapRepository,
} from '../../src/adapters/in-memory/index.ts';

const MAP_ID = 'map_1' as MapId;
const RIDER = 'ps_rider' as PersonaId;
const DESK = 'ps_desk' as PersonaId;
const MECHANIC = 'ps_mechanic' as PersonaId;

function repository(): MapRepository {
  return createInMemoryMapRepository([
    {
      map: {
        id: MAP_ID,
        name: 'A small map',
        teams: [],
        personas: [
          { id: RIDER, name: 'Rider', icon: 'person' },
          { id: DESK, name: 'Front desk', icon: 'bell' },
          { id: MECHANIC, name: 'Mechanic', icon: 'wrench' },
        ],
        activities: [
          {
            id: 'act_1',
            name: 'First',
            tasks: [
              {
                id: 'tsk_1' as TaskId,
                name: 'A task',
                subtasks: [
                  {
                    id: 'tsk_1a' as TaskId,
                    name: 'A subtask',
                    steps: [{ id: 'stp_1' as StepId, name: 'A step', note: '' }],
                  },
                  { id: 'tsk_1b' as TaskId, name: 'Another subtask', steps: [] },
                ],
              },
            ],
          },
        ],
      },
      product: { id: 'prd_1' as ProductId, name: 'Thing' },
      ratings: [],
    },
  ]);
}

const set = (maps: MapRepository, itemId: string, personaId: PersonaId, on = true) =>
  setPersonaInMap({ maps })({ mapId: MAP_ID, itemId, personaId, on });

describe('personas', () => {
  it('lists the map’s personas with their icons, and nothing starts with any', async () => {
    const view = await getMapView({ maps: repository() })(MAP_ID);
    expect(view.personas).toEqual([
      { id: RIDER, name: 'Rider', icon: 'person' },
      { id: DESK, name: 'Front desk', icon: 'bell' },
      { id: MECHANIC, name: 'Mechanic', icon: 'wrench' },
    ]);
    const task = view.activities[0]?.tasks[0];
    expect(task?.personaIds).toEqual([]);
    expect(task?.subtasks[0]?.personaIds).toEqual([]);
    expect(task?.subtasks[0]?.steps[0]?.personaIds).toEqual([]);
  });

  it('rolls a step’s personas up to its subtask and task, without saving them there', async () => {
    const maps = repository();
    await set(maps, 'stp_1', MECHANIC);
    const task = (await getMapView({ maps })(MAP_ID)).activities[0]?.tasks[0];
    expect(task?.subtasks[0]?.steps[0]?.personaIds).toEqual([MECHANIC]);
    expect(task?.subtasks[0]?.ownPersonaIds).toEqual([]);
    expect(task?.subtasks[0]?.personaIds).toEqual([MECHANIC]);
    expect(task?.ownPersonaIds).toEqual([]);
    expect(task?.personaIds).toEqual([MECHANIC]);
  });

  it('lists a roll-up once each, in the map’s persona order', async () => {
    const maps = repository();
    await set(maps, 'tsk_1', MECHANIC);
    await set(maps, 'tsk_1b', RIDER);
    await set(maps, 'tsk_1a', MECHANIC);
    await set(maps, 'stp_1', DESK);
    const task = (await getMapView({ maps })(MAP_ID)).activities[0]?.tasks[0];
    expect(task?.ownPersonaIds).toEqual([MECHANIC]);
    expect(task?.personaIds).toEqual([RIDER, DESK, MECHANIC]);
    expect(task?.subtasks[0]?.personaIds).toEqual([DESK, MECHANIC]);
  });

  it('takes a persona off the roll-up when the step loses it', async () => {
    const maps = repository();
    await set(maps, 'stp_1', DESK);
    await set(maps, 'stp_1', DESK, false);
    expect((await getMapView({ maps })(MAP_ID)).activities[0]?.tasks[0]?.personaIds).toEqual([]);
  });

  it('refuses an unknown persona, with a stable code', async () => {
    const setting = set(repository(), 'tsk_1', 'ps_none' as PersonaId);
    await expect(setting).rejects.toBeInstanceOf(DomainError);
    await expect(setting).rejects.toMatchObject({ code: 'PERSONA_NOT_FOUND' });
  });

  it('refuses an unknown map, with a stable code', async () => {
    const setting = setPersonaInMap({ maps: repository() })({
      mapId: 'map_none' as MapId,
      itemId: 'tsk_1',
      personaId: RIDER,
      on: true,
    });
    await expect(setting).rejects.toMatchObject({ code: 'MAP_NOT_FOUND' });
  });
});

describe('adding a task for a persona', () => {
  it('saves the persona with the task in one change, so undo takes both away', async () => {
    const maps = repository();
    const { id, before, after } = await addTaskToMap({ maps, newId: () => 'new' })({
      mapId: MAP_ID,
      name: 'New',
      to: { chapterId: 'act_1' },
      personaIds: [DESK],
    });
    const added = (await getMapView({ maps })(MAP_ID)).activities[0]?.tasks.find((task) => task.id === id);
    expect(added?.personaIds).toEqual([DESK]);

    await undoChange({ maps })({ mapId: MAP_ID, before, after });
    expect((await getMapView({ maps })(MAP_ID)).activities[0]?.tasks.map((task) => task.id)).toEqual(['tsk_1']);
  });
});

describe('managing personas', () => {
  it('adds a persona with the next unused icon, and undo takes it away', async () => {
    const maps = repository();
    const { id, before, after } = await addPersonaToMap({ maps, newId: () => 'new' })({ mapId: MAP_ID, name: 'Owner' });
    expect(id).toBe('ps_new');
    expect((await getMapView({ maps })(MAP_ID)).personas.at(-1)).toEqual({ id, name: 'Owner', icon: 'box' });

    await undoChange({ maps })({ mapId: MAP_ID, before, after });
    expect((await getMapView({ maps })(MAP_ID)).personas.map((persona) => persona.id)).toEqual([RIDER, DESK, MECHANIC]);
  });

  it('keeps a renamed persona and a new icon', async () => {
    const maps = repository();
    await renamePersonaInMap({ maps })({ mapId: MAP_ID, personaId: DESK, name: 'Counter' });
    await setPersonaIconInMap({ maps })({ mapId: MAP_ID, personaId: DESK, icon: 'house' });
    expect((await getMapView({ maps })(MAP_ID)).personas[1]).toEqual({ id: DESK, name: 'Counter', icon: 'house' });
  });
});

describe('the sample map', () => {
  it('has personas set on tasks, subtasks and steps, and steps that add someone their subtask doesn’t name', async () => {
    const view = await getMapView({ maps: createSampleMapRepository() })(SAMPLE_MAP_ID);
    const tasks = view.activities.flatMap((activity) => activity.tasks);
    const subtasks = tasks.flatMap((task) => task.subtasks);
    expect(view.personas.length).toBeGreaterThan(1);
    expect(tasks.some((task) => task.ownPersonaIds.length > 0)).toBe(true);
    expect(subtasks.some((sub) => sub.ownPersonaIds.length > 0)).toBe(true);
    expect(
      subtasks.some((sub) =>
        sub.steps.some((step) => step.personaIds.some((personaId) => !sub.ownPersonaIds.includes(personaId))),
      ),
    ).toBe(true);
  });
});
