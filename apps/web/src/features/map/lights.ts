import type { Light, LightCount } from '@litmus/core';

export const LIGHT_COPY: Record<Light, { label: string; meaning: string }> = {
  green: { label: 'Green', meaning: 'Finishable, and nothing material was found.' },
  yellow: { label: 'Yellow', meaning: 'Finishable, with known problems.' },
  red: { label: 'Red', meaning: 'A path exists, but people can’t reliably finish it.' },
  grey: { label: 'Grey', meaning: 'No path yet.' },
  'out-of-scope': { label: 'Out of scope', meaning: 'We won’t, rather than we haven’t.' },
};

/** For a mark drawn straight on the page. */
export const MARK_COLOUR: Record<Light, string> = {
  green: 'text-mark-green',
  yellow: 'text-mark-yellow',
  red: 'text-mark-red',
  grey: 'text-mark-grey',
  'out-of-scope': 'text-mark-grey',
};

/** For a filled control, with its text. */
export const FILL_COLOUR: Record<Light, string> = {
  green: 'bg-light-green text-on-light-green',
  yellow: 'bg-light-yellow text-on-light-yellow',
  red: 'bg-light-red text-on-light-red',
  grey: 'bg-light-grey text-on-light-grey',
  'out-of-scope': 'hatch text-muted shadow-[inset_0_0_0_1px_var(--line)]',
};

export const SEGMENT_COLOUR: Record<Light, string> = {
  green: 'bg-mark-green',
  yellow: 'bg-mark-yellow',
  red: 'bg-mark-red',
  grey: 'bg-light-grey',
  'out-of-scope': 'hatch shadow-[inset_0_0_0_1px_var(--line)]',
};

export const describeMix = (mix: LightCount[]) =>
  mix.map(({ light, count }) => `${String(count)} ${LIGHT_COPY[light].label.toLowerCase()}`).join(', ');
