import type { Instant } from '../../kernel/clock.ts';
import type { MapRepository } from '../../application/ports.ts';
import type { Evidence } from '../../domain/map/evidence.ts';
import type { Light } from '../../domain/map/light.ts';
import { createRating, type Rating } from '../../domain/map/rating.ts';
import type { Activity, MapId, ProductId, TaskId } from '../../domain/map/story-map.ts';
import { createInMemoryMapRepository } from './map-repository.ts';

// Invented: a repair app for a neighbourhood bike workshop. Worst-case content on purpose. Never put real data here.
export const SAMPLE_MAP_ID = 'map_sample' as MapId;
const PRODUCT_ID = 'prd_spoke' as ProductId;
const RATED_AT = '2026-11-04T09:00:00.000Z' as Instant;

type SubtaskRow = [name: string, light: Light];
type TaskRow = [name: string, light: Light] | [name: string, subtasks: SubtaskRow[]];

const ROWS: [activity: string, tasks: TaskRow[]][] = [
  [
    'Find the workshop',
    [
      [
        'Search for a nearby workshop',
        [
          ['Search by postcode', 'green'],
          ['Use my current location', 'green'],
          ['Filter by what’s open now', 'grey'],
        ],
      ],
      ['Check opening hours', 'green'],
      ['Compare prices before calling', 'grey'],
      ['See whether they work on my type of bike, including cargo and electric bikes', 'red'],
    ],
  ],
  [
    'Book a repair',
    [
      [
        'Describe the problem',
        [
          ['Pick from common faults', 'green'],
          ['Write it in my own words', 'green'],
          ['Say what I’ve already tried, in case it changes the quote', 'red'],
          ['Add a voice note', 'grey'],
        ],
      ],
      ['Pick a drop-off slot', 'green'],
      ['Change the slot', 'yellow'],
      ['Book several bikes for one family at the same time', 'red'],
      ['Add a photo of the damage', 'grey'],
      ['Join the waiting list', 'grey'],
      ['Book by phone', 'out-of-scope'],
    ],
  ],
  [
    'Drop off',
    [
      [
        'Check in the bike',
        [
          ['Find the booking', 'green'],
          ['Confirm the customer’s details', 'green'],
          ['Tag the bike', 'yellow'],
          ['Check in a walk-in with no booking', 'red'],
        ],
      ],
      ['Agree what happens if the mechanic finds something else wrong', 'red'],
      ['Get a rough estimate', 'yellow'],
      ['Leave accessories safely', 'grey'],
    ],
  ],
  [
    'Diagnose',
    [
      ['See the day’s queue', 'green'],
      ['Claim a bike', 'green'],
      ['Strip down and inspect', 'green'],
      ['Record what’s worn', 'yellow'],
      ['Look up the right part', 'yellow'],
      [
        'Check parts in stock',
        [
          ['Search by part name', 'yellow'],
          ['Search by manufacturer code', 'green'],
          ['Scan a barcode', 'red'],
          ['See stock at the other branch', 'grey'],
          ['See what’s reserved for other jobs', 'red'],
          ['Find a compatible alternative when the exact part is discontinued', 'red'],
          ['Correct a wrong count', 'yellow'],
          ['Set a reorder level', 'out-of-scope'],
        ],
      ],
      ['Order a missing part', 'red'],
      ['Note a safety problem', 'yellow'],
      ['Ask another mechanic for a second opinion', 'grey'],
      ['Photograph the fault', 'grey'],
      ['Record time spent', 'yellow'],
      ['Flag a stolen bike', 'out-of-scope'],
      ['Find the service history for a bike bought second-hand', 'grey'],
      ['Estimate the labour', 'green'],
    ],
  ],
  [
    'Approve the work',
    [
      [
        'Explain to the customer why the estimate changed after the bike was stripped down',
        [
          ['Show what was found', 'red'],
          ['Show the old and new price side by side', 'grey'],
          ['Attach a photo', 'grey'],
          ['Call them instead', 'red'],
        ],
      ],
      [
        'Approve or decline each repair',
        [
          ['Approve everything', 'yellow'],
          ['Approve some and decline the rest', 'red'],
        ],
      ],
    ],
  ],
  [
    'Repair',
    [
      [
        'Do the work',
        [
          ['See the job sheet', 'green'],
          ['Log parts used', 'green'],
          ['Set a job aside for later', 'out-of-scope'],
        ],
      ],
      ['Tick off the checklist', 'green'],
      ['Test ride', 'green'],
      ['Mark it ready', 'yellow'],
    ],
  ],
  [
    'Collect',
    [
      [
        'Get told it’s ready',
        [
          ['Text message', 'green'],
          ['Email', 'yellow'],
        ],
      ],
      ['Understand what was done', 'red'],
      ['Collect after hours', 'out-of-scope'],
    ],
  ],
  [
    'Pay',
    [
      [
        'See what I owe',
        [
          ['See each line', 'yellow'],
          ['See what changed since the estimate', 'red'],
        ],
      ],
      [
        'Pay at the counter',
        [
          ['Pay by card', 'green'],
          ['Pay by cash', 'green'],
          ['Use a deposit already paid', 'green'],
          ['Split the bill between two people', 'red'],
        ],
      ],
      ['Pay online', 'grey'],
      ['Get a receipt', 'red'],
      ['Claim on insurance', 'out-of-scope'],
      ['Refund a deposit', 'red'],
    ],
  ],
  ['Come back', []],
];

function evidenceFor(light: Light): Evidence[] {
  switch (light) {
    case 'green':
      return [{ kind: 'heuristic-review', violations: [] }];
    case 'yellow':
      return [{ kind: 'heuristic-review', violations: [{ heuristic: 'Efficiency of use', severity: 'minor' }] }];
    case 'red':
      return [{ kind: 'heuristic-review', violations: [{ heuristic: 'Error prevention', severity: 'major' }] }];
    case 'grey':
    case 'out-of-scope':
      return [];
  }
}

function build() {
  const ratings: Rating[] = [];
  const rate = (id: string, light: Light) => {
    const subjectId = id as TaskId;
    ratings.push(
      createRating({ subjectId, productId: PRODUCT_ID, light, evidence: evidenceFor(light), ratedAt: RATED_AT }),
    );
    return subjectId;
  };

  const activities: Activity[] = ROWS.map(([name, rows], a) => ({
    id: `act_${String(a)}`,
    name,
    tasks: rows.map(([taskName, detail], t) => {
      const id = `tsk_${String(a)}_${String(t)}`;
      if (typeof detail === 'string') return { id: rate(id, detail), name: taskName, subtasks: [] };
      return {
        id: id as TaskId,
        name: taskName,
        subtasks: detail.map(([subName, light], s) => ({ id: rate(`${id}_${String(s)}`, light), name: subName })),
      };
    }),
  }));

  return {
    map: { id: SAMPLE_MAP_ID, name: 'Spoke, the workshop app', activities },
    product: { id: PRODUCT_ID, name: 'Spoke' },
    ratings,
  };
}

export const createSampleMapRepository = (): MapRepository => createInMemoryMapRepository([build()]);
