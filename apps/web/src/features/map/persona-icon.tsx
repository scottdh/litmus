import type { PersonaIcon as Icon, PersonaView } from '@litmus/core';
import type { ReactNode } from 'react';

// Drawn on a 16 px grid in one stroke weight, so they sit with LightMark and read without colour.
const GLYPHS: Record<Icon, ReactNode> = {
  person: (
    <>
      <circle cx="8" cy="5" r="2.5" />
      <path d="M3 14c0-2.9 2.2-5 5-5s5 2.1 5 5" />
    </>
  ),
  wrench: (
    <path d="M10.6 2.2a3.3 3.3 0 0 0-3 4.5l-4.9 4.9a1.3 1.3 0 0 0 1.8 1.8l4.9-4.9a3.3 3.3 0 0 0 4.5-3l-2 2-1.9-.4-.4-1.9z" />
  ),
  bell: (
    <>
      <path d="M2.5 12.5h11" />
      <path d="M3.8 12.5a4.2 4.2 0 0 1 8.4 0" />
      <path d="M8 6.5V4.8M6.7 4.5h2.6" />
    </>
  ),
  box: (
    <>
      <path d="M8 2 13.5 5v6L8 14l-5.5-3V5z" />
      <path d="M2.5 5 8 8l5.5-3M8 8v6" />
    </>
  ),
  key: (
    <>
      <circle cx="5" cy="11" r="2.6" />
      <path d="M6.9 9.1 13 3M10.8 5.2l1.6 1.6M9.2 6.8l1.2 1.2" />
    </>
  ),
  house: <path d="M2.5 7.5 8 3l5.5 4.5M4 6.5V13h8V6.5" />,
  phone: (
    <>
      <rect x="4.5" y="1.5" width="7" height="13" rx="1.5" />
      <path d="M7 12h2" />
    </>
  ),
  star: <path d="m8 2 1.8 3.8 4.1.5-3 2.8.8 4.1L8 11.2l-3.7 2 .8-4.1-3-2.8 4.1-.5z" />,
};

/** A persona's glyph. Give it a label unless its name sits beside it. */
export function PersonaGlyph({
  icon,
  label,
  className = 'size-3.5',
}: {
  icon: Icon;
  label?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {label && <title>{label}</title>}
      {GLYPHS[icon]}
    </svg>
  );
}

/** A row's name with its personas after it. The last word and the glyphs share a line, so the glyphs never sit alone. */
export function PersonaName({
  name,
  className,
  personas,
  ids,
}: {
  name: string;
  className: string;
  personas: PersonaView[];
  ids: string[];
}) {
  if (ids.length === 0) return <span className={className}>{name}</span>;
  const cut = name.lastIndexOf(' ') + 1;
  return (
    <span>
      {cut > 0 && <span className={className}>{name.slice(0, cut)}</span>}
      <span className="whitespace-nowrap">
        <span className={className}>{name.slice(cut)}</span>
        <span className="ms-1.5 inline-flex translate-y-[0.15em] items-center gap-1 align-baseline text-muted">
          {personas
            .filter((persona) => ids.includes(persona.id))
            .map((persona) => (
              <PersonaGlyph key={persona.id} icon={persona.icon} label={persona.name} />
            ))}
        </span>
      </span>
    </span>
  );
}
