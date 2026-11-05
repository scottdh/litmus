import type { Instant } from '../../kernel/clock.ts';
import type { MapRepository } from '../../application/ports.ts';
import type { Evidence } from '../../domain/map/evidence.ts';
import type { Light } from '../../domain/map/light.ts';
import { createRating, type Rating } from '../../domain/map/rating.ts';
import type { Activity, MapId, ProductId, Step, StepId, TaskId } from '../../domain/map/story-map.ts';
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

const STEPS: Record<string, [name: string, note: string][]> = {
  'Find a compatible alternative when the exact part is discontinued': [
    [
      'Work out which measurements actually decide whether a part fits, because the manufacturer’s own compatibility chart stops at 2019',
      'Three mechanics at the workshop each check something different first. One goes by axle standard, one by freehub body, and one by whatever the last bike of that model took. None of them trusts the chart for anything older than about five years, and all of them keep their own paper notes on it. If the product is going to suggest alternatives, it has to show the measurement it matched on, or they will check it by hand anyway and the suggestion saves nothing.\n\nOne of them also pointed out that a part can fit and still be wrong: a cheaper cassette changes the gearing enough that the customer notices on the first hill.',
    ],
    [
      'Look up the part by the old code',
      'The old code is often only on the box, which has gone by the time the bike comes in.',
    ],
    ['Compare what’s left in stock against those measurements', ''],
    ['Check the alternative with a second mechanic', 'Only done for brakes and anything on a child’s bike.'],
    ['Tell the customer it’s a different part, and why', ''],
    ['Note the swap on the job sheet', 'If it isn’t written down, the next repair starts from the wrong assumption.'],
    ['Remember the match for next time', ''],
  ],
  'Scan a barcode': [
    ['Open the camera from the stock screen', ''],
    ['Handle a label that’s damaged or oily', 'Labels in the back room often won’t scan first time.'],
    ['Fall back to typing the code', ''],
  ],
  'Approve some and decline the rest': [
    ['See each repair on its own line', ''],
    [
      'Understand what happens if I decline the brake pads but approve the rest',
      'It isn’t clear whether declining one repair changes the labour charge on the others.',
    ],
    ['Change my mind before work starts', ''],
    ['Get a new total straight away', ''],
  ],
  'Split the bill between two people': [
    ['Say how it’s split', 'By item or by amount.'],
    ['Take the first payment', ''],
    ['Keep the job open until the second payment', ''],
    ['Send one receipt each', ''],
    ['Handle one card being declined', ''],
  ],
  'Say what I’ve already tried, in case it changes the quote': [['Pick from what people usually try', '']],
};

const stepsFor = (subtaskId: string, name: string): Step[] =>
  (STEPS[name] ?? []).map(([stepName, note], index) => ({
    id: `stp_${subtaskId}_${String(index)}` as StepId,
    name: stepName,
    note,
  }));

// One is long on purpose, to find out what breaks.
function evidenceFor(light: Light): Evidence[] {
  switch (light) {
    case 'green':
      return [{ kind: 'note', text: 'Tried it on the test site with a realistic booking. Nothing to report.' }];
    case 'yellow':
      return [
        {
          kind: 'note',
          text: 'You can finish it, but the error messages don’t say what to fix, so most people go back at least once before it works. It also calls the same thing by two different names.',
        },
      ];
    case 'red':
      return [
        { kind: 'note', text: 'Works on a good day. Falls over if you make a mistake, because there’s no way back.' },
      ];
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
        subtasks: detail.map(([subName, light], s) => ({
          id: rate(`${id}_${String(s)}`, light),
          name: subName,
          steps: stepsFor(`${id}_${String(s)}`, subName),
        })),
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
