/** A squad's chosen chapters. View state only: nothing here reaches the domain. */
export type ChapterState = 'rest' | 'focused' | 'background';

const NAMES = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

export const toggleFocus = (focus: string[], id: string) =>
  focus.includes(id) ? focus.filter((other) => other !== id) : [...focus, id];

export function chapterState(focus: string[], id: string): ChapterState {
  if (focus.length === 0) return 'rest';
  return focus.includes(id) ? 'focused' : 'background';
}

export function focusSummary(chapters: { id: string; name: string }[], focus: string[]) {
  const names = chapters.filter((chapter) => focus.includes(chapter.id)).map((chapter) => chapter.name);
  return names.length === 0 ? '' : `Focused on ${NAMES.format(names)}.`;
}

/** Stored values can be stale or tampered with, so anything unexpected just means no focus. */
export function restoreFocus(stored: string | null, chapterIds: string[]): string[] {
  if (stored === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return chapterIds.filter((id) => parsed.includes(id));
}
