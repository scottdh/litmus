import type { LightCount } from '@litmus/core';
import { SEGMENT_COLOUR, describeMix } from './lights';

/** Counts stacked in a fixed order. Deliberately never a percentage. */
export function MixBar({ mix, className }: { mix: LightCount[]; className: string }) {
  if (mix.length === 0) {
    return <div className={`shadow-[inset_0_0_0_1px_var(--line)] ${className}`} />;
  }
  return (
    <div role="img" aria-label={describeMix(mix)} className={`flex gap-px overflow-hidden ${className}`}>
      {mix.map(({ light, count }) => (
        <span key={light} className={SEGMENT_COLOUR[light]} style={{ flexGrow: count }} />
      ))}
    </div>
  );
}
