'use client';
import type { ComponentProps } from 'react';
import { PersonaByline } from './persona-byline';
import { TeamLine } from './team-line';

/**
 * "Who" and "Team" as a two-column list under a name, in the drawer and on the task view alike, so the glyphs read
 * the same in both. Keyed by the item, so moving to another starts from that item's choices.
 */
export function WhoList({
  id,
  personas,
  team,
  className = '',
}: {
  id: string;
  className?: string;
  /** Null when there are no personas on the map. */
  personas: ComponentProps<typeof PersonaByline> | null;
  /** Null for a step, which takes no team. */
  team: ComponentProps<typeof TeamLine> | null;
}) {
  if (personas === null && team === null) return null;
  return (
    <dl
      className={`${className} grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1.5 text-[13px] leading-relaxed`}
    >
      {personas !== null && <PersonaByline key={`personas-${id}`} {...personas} />}
      {team !== null && <TeamLine key={`team-${id}`} {...team} />}
    </dl>
  );
}
