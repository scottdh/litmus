import type {
  Idea,
  IdeaId,
  PainPoint,
  PainPointId,
  PersonaId,
  Quote,
  QuoteId,
  Research,
} from '../../domain/map/story-map.ts';

// Invented research for the sample bike workshop: summaries, pain points, quotes and ideas. Never put real data here.

const M = 'ps_mechanic' as PersonaId;
const S = 'ps_stock' as PersonaId;
const D = 'ps_desk' as PersonaId;
const R = 'ps_rider' as PersonaId;
const O = 'ps_owner' as PersonaId;

const pain = (id: string, text: string): PainPoint => ({ id: id as PainPointId, text });
const quote = (id: string, personaId: PersonaId, participant: string, text: string): Quote => ({
  id: id as QuoteId,
  text,
  personaId,
  participant,
});
const idea = (id: string, text: string): Idea => ({ id: id as IdeaId, text });

const RESEARCH: Record<string, Research> = {
  // Worst case: every section full, long quotes, and more voices than the drawer shows.
  'Check parts in stock': {
    summary:
      'Once a bike is stripped down, the mechanic needs to know whether the part is on the shelf before quoting the customer. Today that means walking to the stores, asking the stock keeper, or trusting a count that is often a week out of date. When the part is missing, the job stalls and the bike takes up a stand.',
    pains: [
      pain('pain_stock_1', 'Counts drift, so mechanics stop trusting the system and check the shelf by hand.'),
      pain('pain_stock_2', 'Parts set aside for one job get taken for another, and nobody finds out until collection.'),
      pain('pain_stock_3', 'The front desk can’t answer “do you have it?” without leaving the counter.'),
      pain('pain_stock_4', 'Checking the other branch means a phone call, so it often doesn’t happen.'),
      pain('pain_stock_5', 'Discontinued parts send the mechanic to forums to find a compatible alternative.'),
    ],
    hearing: [
      quote(
        'qt_stock_1',
        M,
        'P3, mechanic',
        'The screen said we had four chains. I went to the shelf and there were none. So now I don’t believe the screen, I just walk over and look.',
      ),
      quote(
        'qt_stock_2',
        S,
        'P7, stock keeper',
        'I count the tubes every Friday and by Tuesday the number’s wrong again.',
      ),
      quote(
        'qt_stock_3',
        M,
        'P5, mechanic',
        'If it’s reserved for another job, nobody knows. I’ve taken a brake pad off someone else’s bike before and they found out on collection day.',
      ),
      quote(
        'qt_stock_4',
        D,
        'P2, front desk',
        'Customers ask me at the desk whether we’ve got the part and I genuinely have no way to tell them.',
      ),
      quote(
        'qt_stock_5',
        S,
        'P8, stock keeper',
        'The other branch nearly always has it. But ringing them takes ten minutes and they’re busy too.',
      ),
      quote(
        'qt_stock_6',
        S,
        'P7, stock keeper',
        'Half my morning is people shouting across the workshop asking if we’ve got something.',
      ),
    ],
    ideas: [
      idea('idea_stock_1', 'Show how fresh a count is, so people know when to trust it.'),
      idea('idea_stock_2', 'Reserve a part against a job the moment it’s quoted.'),
      idea('idea_stock_3', 'Let the front desk see stock without asking the workshop.'),
      idea('idea_stock_4', 'Show the other branch’s stock alongside our own.'),
      idea('idea_stock_5', 'Suggest known alternatives for discontinued parts, learned from past jobs.'),
    ],
  },
  'Scan a barcode': {
    summary:
      'Mechanics want to scan the box rather than type a manufacturer code with greasy hands. Many older parts have no barcode, or a label that has worn off.',
    pains: [
      pain('pain_barcode_1', 'Phone cameras struggle with scuffed labels under workshop lighting.'),
      pain('pain_barcode_2', 'Unlabelled stock has no way in.'),
    ],
    hearing: [
      quote('qt_barcode_1', S, 'P7, stock keeper', 'About a third of the old stock has no label at all.'),
      quote('qt_barcode_2', M, 'P3, mechanic', 'I’m not taking my gloves off to type a twelve-digit code.'),
    ],
    ideas: [idea('idea_barcode_1', 'Print our own labels for unlabelled stock when it’s counted.')],
  },
  'Find a compatible alternative when the exact part is discontinued': {
    summary:
      'Older bikes often need parts that are no longer made. Mechanics rely on memory and forum threads to find a part that fits, and the front desk then has to explain the swap to the customer.',
    pains: [
      pain('pain_alt_1', 'What one mechanic knows about compatible parts isn’t written down anywhere.'),
      pain('pain_alt_2', 'Customers are suspicious when they get a different part from the one quoted.'),
    ],
    hearing: [
      quote(
        'qt_alt_1',
        O,
        'P10, owner',
        'Steve knows every compatible cassette off the top of his head. When he’s on holiday we’re stuck.',
      ),
    ],
    ideas: [idea('idea_alt_1', 'Remember every substitution a mechanic makes, and offer it next time.')],
  },
  // Summary only, to see how a sparse drawer reads.
  'See stock at the other branch': {
    summary:
      'The two branches share stock informally. Stock keepers phone each other and send parts over with whoever is driving.',
    pains: [],
    hearing: [],
    ideas: [],
  },
  'Order a missing part': {
    summary:
      'When a part isn’t in stock, the stock keeper orders it from one of three suppliers and tells the mechanic when it’ll arrive. The bike waits on the stand or is moved to the back.',
    pains: [
      pain('pain_order_1', 'Comparing three suppliers’ delivery times means three websites.'),
      pain('pain_order_2', 'Mechanics aren’t told when the part arrives.'),
      pain('pain_order_3', 'Riders get a date that keeps moving, with no reason given.'),
    ],
    hearing: [
      quote('qt_order_1', M, 'P5, mechanic', 'Nobody tells me the part’s arrived. I find it on the bench a day later.'),
      quote(
        'qt_order_2',
        R,
        'P12, rider',
        'They told me Tuesday, then Thursday, then the next week. I just wanted to know when.',
      ),
      quote(
        'qt_order_3',
        S,
        'P8, stock keeper',
        'I order from whoever can get it here tomorrow, even if it’s dearer. A bike on a stand costs us more than the part.',
      ),
    ],
    ideas: [
      idea('idea_order_1', 'Compare suppliers on delivery date, not just price.'),
      idea('idea_order_2', 'Tell the mechanic and the rider the moment the part is booked in.'),
    ],
  },
  'Tell the customer it’s a different part, and why': {
    summary: 'The front desk explains the swap, usually by phone, often without knowing why the mechanic chose it.',
    pains: [pain('pain_swap_1', 'The desk can’t explain a swap it doesn’t understand.')],
    hearing: [
      quote(
        'qt_swap_1',
        D,
        'P2, front desk',
        'I’m the one who has to say it’s a different part, and I don’t know the first thing about cassettes.',
      ),
    ],
    ideas: [idea('idea_swap_1', 'Have the mechanic leave a one-line reason the desk can read out.')],
  },
};

/** Keyed by name. Anything missing has no research yet, which is most of the map. */
export const researchFor = (name: string): { research?: Research } => {
  const research = RESEARCH[name];
  return research ? { research } : {};
};
