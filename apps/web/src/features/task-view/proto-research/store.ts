'use client';
// PROTOTYPE (#104). Throwaway. Research held in the browser only, so every edit resets on reload.
import { useState } from 'react';
import type { QuoteView } from '@litmus/core';

export interface PQuote extends QuoteView {
  id: string;
}
export interface PPain {
  id: string;
  text: string;
  quotes: PQuote[];
}
export interface PItem {
  id: string;
  text: string;
}
export interface PResearch {
  summary: string;
  pains: PPain[];
  loose: PQuote[];
  ideas: PItem[];
}

let next = 0;
export const newId = (prefix: string) => `${prefix}${String(++next)}`;

export function seed(input: {
  summary: string | null;
  pains: { text: string; quotes: QuoteView[] }[];
  loose: QuoteView[];
  ideas: string[];
}): PResearch {
  const quote = (q: QuoteView): PQuote => ({ ...q, id: newId('q') });
  return {
    summary: input.summary ?? '',
    pains: input.pains.map((p) => ({ id: newId('p'), text: p.text, quotes: p.quotes.map(quote) })),
    loose: input.loose.map(quote),
    ideas: input.ideas.map((text) => ({ id: newId('i'), text })),
  };
}

/** Where a quote lives: under a pain point, or null for not yet placed. */
export type Place = string | null;

const take = (r: PResearch, quoteId: string): [PResearch, PQuote | null] => {
  let found: PQuote | null = null;
  const pains = r.pains.map((p) => {
    const q = p.quotes.find((x) => x.id === quoteId);
    if (q) found = q;
    return q ? { ...p, quotes: p.quotes.filter((x) => x.id !== quoteId) } : p;
  });
  const lq = r.loose.find((x) => x.id === quoteId);
  if (lq) found = lq;
  return [{ ...r, pains, loose: r.loose.filter((x) => x.id !== quoteId) }, found];
};

const put = (r: PResearch, quote: PQuote, to: Place, index?: number): PResearch => {
  const insert = (list: PQuote[]) => {
    const copy = [...list];
    copy.splice(index ?? copy.length, 0, quote);
    return copy;
  };
  if (to === null) return { ...r, loose: insert(r.loose) };
  return { ...r, pains: r.pains.map((p) => (p.id === to ? { ...p, quotes: insert(p.quotes) } : p)) };
};

export const ops = {
  setSummary: (r: PResearch, summary: string) => ({ ...r, summary }),
  addPain: (r: PResearch, text: string, id = newId('p')) => ({
    ...r,
    pains: [...r.pains, { id, text, quotes: [] }],
  }),
  editPain: (r: PResearch, id: string, text: string) => ({
    ...r,
    pains: r.pains.map((p) => (p.id === id ? { ...p, text } : p)),
  }),
  /** Its quotes go back to not yet placed, so removing a pain point never loses what people said. */
  removePain: (r: PResearch, id: string) => {
    const pain = r.pains.find((p) => p.id === id);
    return { ...r, pains: r.pains.filter((p) => p.id !== id), loose: [...(pain?.quotes ?? []), ...r.loose] };
  },
  movePain: (r: PResearch, id: string, by: -1 | 1) => {
    const at = r.pains.findIndex((p) => p.id === id);
    const to = at + by;
    if (at < 0 || to < 0 || to >= r.pains.length) return r;
    const pains = [...r.pains];
    const [moved] = pains.splice(at, 1);
    if (moved) pains.splice(to, 0, moved);
    return { ...r, pains };
  },
  /** Folds one pain point's voices into another, keeping the other's words. */
  mergePain: (r: PResearch, fromId: string, intoId: string) => {
    const from = r.pains.find((p) => p.id === fromId);
    if (!from) return r;
    return {
      ...r,
      pains: r.pains
        .filter((p) => p.id !== fromId)
        .map((p) => (p.id === intoId ? { ...p, quotes: [...p.quotes, ...from.quotes] } : p)),
    };
  },
  addQuote: (r: PResearch, quote: Omit<PQuote, 'id'>, to: Place) => put(r, { ...quote, id: newId('q') }, to),
  editQuote: (r: PResearch, id: string, patch: Partial<Omit<PQuote, 'id'>>) => {
    const edit = (q: PQuote) => (q.id === id ? { ...q, ...patch } : q);
    return { ...r, pains: r.pains.map((p) => ({ ...p, quotes: p.quotes.map(edit) })), loose: r.loose.map(edit) };
  },
  removeQuote: (r: PResearch, id: string) => take(r, id)[0],
  moveQuote: (r: PResearch, id: string, to: Place, index?: number) => {
    const [without, quote] = take(r, id);
    return quote ? put(without, quote, to, index) : r;
  },
  addIdea: (r: PResearch, text: string) => ({ ...r, ideas: [...r.ideas, { id: newId('i'), text }] }),
  editIdea: (r: PResearch, id: string, text: string) => ({
    ...r,
    ideas: r.ideas.map((i) => (i.id === id ? { ...i, text } : i)),
  }),
  removeIdea: (r: PResearch, id: string) => ({ ...r, ideas: r.ideas.filter((i) => i.id !== id) }),
};

export const placeOf = (r: PResearch, quoteId: string): Place =>
  r.pains.find((p) => p.quotes.some((q) => q.id === quoteId))?.id ?? null;

export interface Change {
  token: string;
  message: string;
  before: PResearch;
}

/** The research, a way to change it, and Undo for the last change that loses or moves something. */
export function useResearch(initial: PResearch) {
  const [research, setResearch] = useState(initial);
  const [last, setLast] = useState<Change | null>(null);
  return {
    research,
    /** A quiet change, like typing, that needs no Undo. */
    set: (next: PResearch) => {
      setResearch(next);
    },
    /** A change that gets the Undo toast. */
    change: (next: PResearch, message: string) => {
      setLast({ token: newId('c'), message, before: research });
      setResearch(next);
    },
    last,
    undo: () => {
      if (last) setResearch(last.before);
      setLast(null);
    },
  };
}
export type ResearchStore = ReturnType<typeof useResearch>;

// Repeats. A crude word overlap, good enough to show what the nudge feels like. The real one is a later question.
const STOP = new Set(
  'the a an and or but so to of in on at for with from by is are was were be been it its it’s this that these those i we you they he she me my our your their them us not no do does did have has had just then than there here what when who how which can can’t don’t isn’t into out up over about as if all any some get got go goes going one two half now also very really still always never nobody someone something every'.split(
    ' ',
  ),
);
const stem = (word: string) => word.replace(/(ing|ed|es|s)$/, '');
const words = (text: string) =>
  new Set(
    text
      .toLowerCase()
      .replace(/[’']/g, '’')
      .split(/[^a-z’]+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
      .map(stem),
  );

/** How alike two pieces of text are, from 0 to 1. */
export function likeness(a: string, b: string) {
  const wa = words(a);
  const wb = words(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  let shared = 0;
  wa.forEach((w) => {
    if (wb.has(w)) shared++;
  });
  return shared < 2 ? 0 : shared / Math.min(wa.size, wb.size);
}

/** Pain points that sound like this text, closest first. A pain point is matched on its words and its quotes. */
export function soundsLike(r: PResearch, text: string, exceptId?: string, threshold = 0.25) {
  if (text.trim().split(/\s+/).length < 3) return [];
  return r.pains
    .filter((p) => p.id !== exceptId)
    .map((p) => ({
      pain: p,
      score: Math.max(likeness(text, p.text), ...p.quotes.map((q) => likeness(text, q.text) * 0.9)),
    }))
    .filter((m) => m.score >= threshold)
    .sort((x, y) => y.score - x.score)
    .map((m) => m.pain);
}

export const voices = (n: number) => (n === 1 ? '1 voice' : `${String(n)} voices`);
export const short = (text: string, max = 60) => (text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`);
