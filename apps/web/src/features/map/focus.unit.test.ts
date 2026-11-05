import { describe, expect, it } from 'vitest';
import { chapterState, focusSummary, restoreFocus, toggleFocus } from './focus';

const CHAPTERS = [
  { id: 'a', name: 'Find the workshop' },
  { id: 'b', name: 'Book a repair' },
  { id: 'c', name: 'Drop off' },
];
const IDS = CHAPTERS.map((chapter) => chapter.id);

describe('toggleFocus', () => {
  it('adds a chapter that is not in focus', () => {
    expect(toggleFocus(['a'], 'c')).toEqual(['a', 'c']);
  });

  it('removes a chapter that is in focus', () => {
    expect(toggleFocus(['a', 'c'], 'a')).toEqual(['c']);
  });
});

describe('chapterState', () => {
  it('leaves every chapter at rest when nothing is in focus', () => {
    expect(chapterState([], 'a')).toBe('rest');
  });

  it('marks chapters in the focus as focused', () => {
    expect(chapterState(['a'], 'a')).toBe('focused');
  });

  it('sends every other chapter to the background', () => {
    expect(chapterState(['a'], 'b')).toBe('background');
  });
});

describe('focusSummary', () => {
  it('is empty when nothing is in focus', () => {
    expect(focusSummary(CHAPTERS, [])).toBe('');
  });

  it('names one chapter', () => {
    expect(focusSummary(CHAPTERS, ['b'])).toBe('Focused on Book a repair.');
  });

  it('names chapters in story order, however they were picked', () => {
    expect(focusSummary(CHAPTERS, ['c', 'a'])).toBe('Focused on Find the workshop and Drop off.');
  });
});

describe('restoreFocus', () => {
  it('returns what was stored', () => {
    expect(restoreFocus('["a","c"]', IDS)).toEqual(['a', 'c']);
  });

  it('starts empty when nothing was stored', () => {
    expect(restoreFocus(null, IDS)).toEqual([]);
  });

  it('starts empty when what was stored is not JSON', () => {
    expect(restoreFocus('not json', IDS)).toEqual([]);
  });

  it('starts empty when what was stored is not a list', () => {
    expect(restoreFocus('{"a":1}', IDS)).toEqual([]);
  });

  it('drops chapters that no longer exist, and anything that is not an id', () => {
    expect(restoreFocus('["a","gone",3]', IDS)).toEqual(['a']);
  });

  it('drops duplicates', () => {
    expect(restoreFocus('["a","a"]', IDS)).toEqual(['a']);
  });
});
