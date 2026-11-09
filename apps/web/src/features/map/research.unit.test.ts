import type { ResearchView } from '@litmus/core';
import { describe, expect, it } from 'vitest';
import { researchSections } from './research';

const quote = (n: number) => ({ text: `Quote ${String(n)}`, personaId: null, participant: `P${String(n)}` });
const full: ResearchView = {
  summary: 'What the task is.',
  hearing: [1, 2, 3, 4, 5, 6].map(quote),
  pains: ['One', 'Two', 'Three', 'Four', 'Five', 'Six'],
  ideas: ['An idea'],
};

describe('researchSections', () => {
  it('gives the summary on its own, then the folds in order', () => {
    const { summary, folds } = researchSections(full, 'task');
    expect(summary).toBe('What the task is.');
    expect(folds.map((fold) => fold.title)).toEqual([
      'What we’re hearing',
      'Pain points',
      'How might we better support this task?',
    ]);
  });

  it('shows at most five of each, and counts what it shows', () => {
    const { folds } = researchSections(full, 'task');
    expect(folds[0]).toMatchObject({ key: 'hearing', count: 5 });
    expect(folds[0]?.key === 'hearing' && folds[0].quotes.map((q) => q.text)).toEqual([
      'Quote 1',
      'Quote 2',
      'Quote 3',
      'Quote 4',
      'Quote 5',
    ]);
    expect(folds[1]).toMatchObject({ key: 'pains', count: 5, items: ['One', 'Two', 'Three', 'Four', 'Five'] });
  });

  it('hides a section with nothing in it', () => {
    const { summary, folds } = researchSections({ summary: '', hearing: [], pains: ['Only this'], ideas: [] }, 'task');
    expect(summary).toBeNull();
    expect(folds.map((fold) => fold.key)).toEqual(['pains']);
  });

  it('asks about the subtask or step it’s on', () => {
    expect(researchSections(full, 'subtask').folds[2]?.title).toBe('How might we better support this subtask?');
    expect(researchSections(full, 'step').folds[2]?.title).toBe('How might we better support this step?');
  });

  it('says there’s nothing when there’s no research, or none worth showing', () => {
    expect(researchSections(null, 'task').empty).toBe(true);
    expect(researchSections({ summary: ' ', hearing: [], pains: [], ideas: [] }, 'task').empty).toBe(true);
    expect(researchSections(full, 'task').empty).toBe(false);
  });
});
