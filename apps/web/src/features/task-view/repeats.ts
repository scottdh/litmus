const STOPWORDS = new Set(
  (
    'about after again all also and any are because been before being both but can cant could did didnt does doesnt ' +
    'doing dont each even every for from get gets got had has have her here him his how into isnt its just like more ' +
    'most much not now off once only other our out over own really said same she should some such than that the their ' +
    'them then there these they this those through too under until very was wasnt way were what when where which while ' +
    'who why will with wont would you your'
  ).split(' '),
);

const ENDINGS = ['ing', 'ed', 'es', 's'];
const SHORTEST = 3;

function stem(word: string): string {
  let base = word;
  for (const ending of ENDINGS) {
    if (!base.endsWith(ending) || base.length - ending.length < SHORTEST) continue;
    if (ending === 's' && base.endsWith('ss')) break;
    base = base.slice(0, -ending.length);
    break;
  }
  // So "make" and "making", "note" and "notes" meet.
  return base.endsWith('e') && base.length > SHORTEST ? base.slice(0, -1) : base;
}

/** The words a repeat is judged on: lower case, longer than two letters, no stopwords, endings stripped. */
export function repeatWords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word))
    .map(stem);
  return [...new Set(words)];
}

const FEWEST_WRITTEN = 3;
const FEWEST_SHARED = 2;
const THRESHOLD = 0.4;

/**
 * Something in the same list that the draft reads like, or null. Shared words over the shorter text's count, from
 * 0.4. Crude on purpose: it suggests, it never blocks.
 */
export function findRepeat<T extends { id: string; text: string }>(
  draft: string,
  others: readonly T[],
  skipId?: string,
): T | null {
  const written = repeatWords(draft);
  if (written.length < FEWEST_WRITTEN) return null;
  let best: { item: T; score: number } | null = null;
  for (const other of others) {
    if (other.id === skipId) continue;
    const theirs = new Set(repeatWords(other.text));
    const shared = written.filter((word) => theirs.has(word)).length;
    if (shared < FEWEST_SHARED) continue;
    const score = shared / Math.min(written.length, theirs.size);
    if (score >= THRESHOLD && (best === null || score > best.score)) best = { item: other, score };
  }
  return best?.item ?? null;
}

const EXCERPT_WORDS = 12;

/** Enough of a long text to recognise it in a sentence. */
export function excerpt(text: string): string {
  const words = text.trim().split(/\s+/);
  return words.length <= EXCERPT_WORDS ? words.join(' ') : `${words.slice(0, EXCERPT_WORDS).join(' ')}…`;
}
