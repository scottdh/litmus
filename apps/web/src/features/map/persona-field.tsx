'use client';
import type { PersonaView } from '@litmus/core';
import { useState } from 'react';
import { PersonaGlyph } from './persona-icon';

/**
 * Who carries this out. Any number can be picked, and each change saves at once.
 * Personas set further down roll up here, and are shown under the picker rather than in it, because they're set there.
 */
export function PersonaField({
  personas,
  own,
  rolled,
  from,
  onChange,
}: {
  personas: PersonaView[];
  own: string[];
  rolled: string[];
  /** Where rolled-up personas come from, such as "its subtasks". Null for a step, which has nothing beneath it. */
  from: string | null;
  onChange: (personaId: string, on: boolean) => Promise<{ ok: boolean }>;
}) {
  const [failed, setFailed] = useState(false);
  // Shows the choice at once, rather than waiting for the map to come back from the server.
  const [shown, setShown] = useState<ReadonlySet<string>>(new Set(own));
  const below = personas.filter((persona) => rolled.includes(persona.id) && !shown.has(persona.id));

  const toggle = (id: string) => {
    const on = !shown.has(id);
    const before = shown;
    const next = new Set(shown);
    if (on) next.add(id);
    else next.delete(id);
    const undo = () => {
      setShown(before);
      setFailed(true);
    };
    setFailed(false);
    setShown(next);
    void onChange(id, on).then((result) => {
      if (!result.ok) undo();
    }, undo);
  };

  return (
    <div role="group" aria-labelledby="drawer-personas" className="flex w-full flex-col gap-2">
      <span id="drawer-personas" className="text-[13px] text-muted">
        Personas
      </span>
      <div className="flex flex-wrap gap-1.5">
        {personas.map((persona) => {
          const pressed = shown.has(persona.id);
          return (
            <button
              key={persona.id}
              type="button"
              aria-pressed={pressed}
              onClick={() => {
                toggle(persona.id);
              }}
              className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-sm ps-2 pe-2.5 text-[13px] font-medium transition-[background-color,color,box-shadow,scale] duration-150 ease-out active:scale-[0.96] max-lg:h-11 ${pressed ? 'bg-ink text-canvas' : 'text-muted shadow-raised hover:text-ink'}`}
            >
              <PersonaGlyph icon={persona.icon} />
              {persona.name}
            </button>
          );
        })}
      </div>
      {from !== null && below.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] leading-snug text-pretty text-muted">
          <span>Also from {from}:</span>
          {below.map((persona, index) => (
            <span key={persona.id} className="inline-flex items-center gap-1 text-ink">
              <PersonaGlyph icon={persona.icon} />
              {persona.name}
              {index < below.length - 1 && <span className="-ms-1 text-muted">,</span>}
            </span>
          ))}
        </p>
      )}
      {failed && (
        <p role="alert" className="text-[13px] text-pretty text-muted">
          That persona couldn’t be saved, so it hasn’t changed.
        </p>
      )}
    </div>
  );
}
