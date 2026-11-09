import type { PersonaId, Research } from '../../domain/map/story-map.ts';

// Invented research for the sample bike workshop: summaries, quotes, pain points and ideas. Never put real data here.

const M = 'ps_mechanic' as PersonaId;
const S = 'ps_stock' as PersonaId;
const D = 'ps_desk' as PersonaId;
const R = 'ps_rider' as PersonaId;
const O = 'ps_owner' as PersonaId;

const RESEARCH: Record<string, Research> = {
  // Worst case: every section full, long quotes.
  'Check parts in stock': {
    summary:
      'Once a bike is stripped down, the mechanic needs to know whether the part is on the shelf before quoting the customer. Today that means walking to the stores, asking the stock keeper, or trusting a count that is often a week out of date. When the part is missing, the job stalls and the bike takes up a stand.',
    hearing: [
      {
        text: 'The screen said we had four chains. I went to the shelf and there were none. So now I don’t believe the screen, I just walk over and look.',
        personaId: M,
        participant: 'P3, mechanic',
      },
      {
        text: 'Half my morning is people shouting across the workshop asking if we’ve got something.',
        personaId: S,
        participant: 'P7, stock keeper',
      },
      {
        text: 'If it’s reserved for another job, nobody knows. I’ve taken a brake pad off someone else’s bike before and they found out on collection day.',
        personaId: M,
        participant: 'P5, mechanic',
      },
      {
        text: 'Customers ask me at the desk whether we’ve got the part and I genuinely have no way to tell them.',
        personaId: D,
        participant: 'P2, front desk',
      },
      {
        text: 'The other branch nearly always has it. But ringing them takes ten minutes and they’re busy too.',
        personaId: S,
        participant: 'P8, stock keeper',
      },
    ],
    pains: [
      'Counts drift, so mechanics stop trusting the system and check the shelf by hand.',
      'Parts set aside for one job get taken for another, and nobody finds out until collection.',
      'The front desk can’t answer “do you have it?” without leaving the counter.',
      'Checking the other branch means a phone call, so it often doesn’t happen.',
      'Discontinued parts send the mechanic to forums to find a compatible alternative.',
    ],
    ideas: [
      'Show how fresh a count is, so people know when to trust it.',
      'Reserve a part against a job the moment it’s quoted.',
      'Let the front desk see stock without asking the workshop.',
      'Show the other branch’s stock alongside our own.',
      'Suggest known alternatives for discontinued parts, learned from past jobs.',
    ],
  },
  'Scan a barcode': {
    summary:
      'Mechanics want to scan the box rather than type a manufacturer code with greasy hands. Many older parts have no barcode, or a label that has worn off.',
    hearing: [
      {
        text: 'I’m not taking my gloves off to type a twelve-digit code.',
        personaId: M,
        participant: 'P3, mechanic',
      },
      {
        text: 'About a third of the old stock has no label at all.',
        personaId: S,
        participant: 'P7, stock keeper',
      },
    ],
    pains: ['Phone cameras struggle with scuffed labels under workshop lighting.', 'Unlabelled stock has no way in.'],
    ideas: ['Print our own labels for unlabelled stock when it’s counted.'],
  },
  'Find a compatible alternative when the exact part is discontinued': {
    summary:
      'Older bikes often need parts that are no longer made. Mechanics rely on memory and forum threads to find a part that fits, and the front desk then has to explain the swap to the customer.',
    hearing: [
      {
        text: 'Steve knows every compatible cassette off the top of his head. When he’s on holiday we’re stuck.',
        personaId: O,
        participant: 'P10, owner',
      },
    ],
    pains: [
      'What one mechanic knows about compatible parts isn’t written down anywhere.',
      'Customers are suspicious when they get a different part from the one quoted.',
    ],
    ideas: ['Remember every substitution a mechanic makes, and offer it next time.'],
  },
  // Summary only, to see how a sparse drawer reads.
  'See stock at the other branch': {
    summary:
      'The two branches share stock informally. Stock keepers phone each other and send parts over with whoever is driving.',
    hearing: [],
    pains: [],
    ideas: [],
  },
  'Order a missing part': {
    summary:
      'When a part isn’t in stock, the stock keeper orders it from one of three suppliers and tells the mechanic when it’ll arrive. The bike waits on the stand or is moved to the back.',
    hearing: [
      {
        text: 'I order from whoever can get it here tomorrow, even if it’s dearer. A bike on a stand costs us more than the part.',
        personaId: S,
        participant: 'P8, stock keeper',
      },
      {
        text: 'Nobody tells me the part’s arrived. I find it on the bench a day later.',
        personaId: M,
        participant: 'P5, mechanic',
      },
      {
        text: 'They told me Tuesday, then Thursday, then the next week. I just wanted to know when.',
        personaId: R,
        participant: 'P12, rider',
      },
    ],
    pains: [
      'Comparing three suppliers’ delivery times means three websites.',
      'Mechanics aren’t told when the part arrives.',
      'Riders get a date that keeps moving, with no reason given.',
    ],
    ideas: [
      'Compare suppliers on delivery date, not just price.',
      'Tell the mechanic and the rider the moment the part is booked in.',
    ],
  },
  'Tell the customer it’s a different part, and why': {
    summary: 'The front desk explains the swap, usually by phone, often without knowing why the mechanic chose it.',
    hearing: [
      {
        text: 'I’m the one who has to say it’s a different part, and I don’t know the first thing about cassettes.',
        personaId: D,
        participant: 'P2, front desk',
      },
    ],
    pains: ['The desk can’t explain a swap it doesn’t understand.'],
    ideas: ['Have the mechanic leave a one-line reason the desk can read out.'],
  },
};

/** Keyed by name. Anything missing has no research yet, which is most of the map. */
export const researchFor = (name: string): { research?: Research } => {
  const research = RESEARCH[name];
  return research ? { research } : {};
};
