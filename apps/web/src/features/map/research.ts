import type { QuoteView, ResearchView } from '@litmus/core';

/** The drawer shows this many of each. The task view holds the rest. */
const SHOWN = 5;

export type Fold =
  | { key: 'hearing'; title: string; count: number; quotes: QuoteView[] }
  | { key: 'pains' | 'ideas'; title: string; count: number; items: string[] };

/** What the drawer shows of a task's research: the summary open, then a fold for each section with something in it. */
export function researchSections(
  research: ResearchView | null,
  kind: 'task' | 'subtask' | 'step',
): { summary: string | null; folds: Fold[]; empty: boolean } {
  const summary = research?.summary.trim() ? research.summary.trim() : null;
  const folds: Fold[] = [];
  const quotes = [...(research?.pains.flatMap((pain) => pain.quotes) ?? []), ...(research?.hearing ?? [])].slice(
    0,
    SHOWN,
  );
  if (quotes.length > 0) folds.push({ key: 'hearing', title: 'What we’re hearing', count: quotes.length, quotes });
  const pains = research?.pains.slice(0, SHOWN).map((pain) => pain.text) ?? [];
  if (pains.length > 0) folds.push({ key: 'pains', title: 'Pain points', count: pains.length, items: pains });
  const ideas = research?.ideas.slice(0, SHOWN) ?? [];
  if (ideas.length > 0)
    folds.push({ key: 'ideas', title: `How might we better support this ${kind}?`, count: ideas.length, items: ideas });
  return { summary, folds, empty: summary === null && folds.length === 0 };
}
