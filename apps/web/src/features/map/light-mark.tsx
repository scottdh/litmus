import type { Light } from '@litmus/core';

/** The fill rises with the level of support, so a light still reads without colour. */
export function LightMark({ light, className = 'size-3.5' }: { light: Light; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`shrink-0 ${className}`} aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {light === 'green' && <circle cx="8" cy="8" r="6.25" fill="currentColor" />}
      {light === 'yellow' && <path d="M8 1.75a6.25 6.25 0 0 1 0 12.5z" fill="currentColor" />}
      {light === 'red' && <path d="M8 8V1.75A6.25 6.25 0 0 1 14.25 8z" fill="currentColor" />}
      {light === 'out-of-scope' && <path d="M3.6 3.6l8.8 8.8" stroke="currentColor" strokeWidth="1.5" />}
    </svg>
  );
}
