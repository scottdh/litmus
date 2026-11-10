'use client';
import type { PersonaView } from '@litmus/core';
import { Fragment, useState } from 'react';
import { PopoverPanel, PopoverRoot, PopoverTitle, PopoverTrigger } from '../../ui/popover';
import { PersonaGlyph } from './persona-icon';
import { TriggerChevron } from './select-chevron';
import { personaByline, personaSourceLine, personaSources } from './personas';

/** Hugs its value, so the hover fill and chevron sit with it. It sits 4 px proud of the row, as the hover fill needs. */
export const TRIGGER =
  '-mx-1.5 -my-1 flex max-w-full cursor-pointer items-start gap-1.5 rounded-sm px-1.5 py-1 text-start text-pretty text-muted transition-colors duration-150 ease-out hover:bg-canvas max-lg:min-h-11 max-lg:items-center';

/** Each icon stays with its name. The separators sit outside, so a long list wraps after a comma. */
function Names({ list }: { list: PersonaView[] }) {
  return list.map((persona, index) => (
    <Fragment key={persona.id}>
      <span className="whitespace-nowrap">
        <PersonaGlyph icon={persona.icon} className="me-1 inline size-3.5 -translate-y-px" />
        {persona.name}
      </span>
      {index === list.length - 1 ? '' : index === list.length - 2 ? (list.length > 2 ? ', and ' : ' and ') : ', '}
    </Fragment>
  ));
}

/**
 * Who carries this out, as the "Who" row of the drawer's list under the name. Personas are set once and rarely changed, so they read as a fact
 * rather than a field. It opens a checklist where each change saves at once. Those set further down are ticked and
 * locked there, because they're changed where they're set.
 */
export function PersonaByline({
  personas,
  own,
  below,
  noun,
  onChange,
}: {
  personas: PersonaView[];
  own: string[];
  /** Its subtasks or steps. Empty for a step. */
  below: { name: string; personaIds: string[] }[];
  noun: 'subtasks' | 'steps';
  onChange: (personaId: string, on: boolean) => Promise<{ ok: boolean }>;
}) {
  const [failed, setFailed] = useState(false);
  // Shows the choice at once, rather than waiting for the map to come back from the server.
  const [shown, setShown] = useState<ReadonlySet<string>>(new Set(own));
  const sources = personaSources(below);
  const line = personaByline(personas, [...shown], sources);
  const empty = line.own.length === 0 && line.below.length === 0;
  const from = `its ${noun}`;

  const toggle = (id: string) => {
    const on = !shown.has(id);
    // Puts back only this persona, so a quick second toggle that did save isn't lost with it.
    const undo = () => {
      setShown((current) => {
        const next = new Set(current);
        if (on) next.delete(id);
        else next.add(id);
        return next;
      });
      setFailed(true);
    };
    setFailed(false);
    setShown((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
    void onChange(id, on).then((result) => {
      if (!result.ok) undo();
    }, undo);
  };

  return (
    <>
      <dt className="text-muted">Who</dt>
      <dd className="flex min-w-0 flex-col items-start gap-1">
        <PopoverRoot>
          <PopoverTrigger className={TRIGGER}>
            {empty ? (
              <span className="inline-flex items-center gap-1.5">
                <svg
                  viewBox="0 0 12 12"
                  aria-hidden="true"
                  className="size-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M6 2.5v7M2.5 6h7" />
                </svg>
                Add personas
              </span>
            ) : (
              <>
                <span className="min-w-0">
                  <span className="sr-only">Personas: </span>
                  {line.own.length > 0 && (
                    <span className="block text-ink">
                      <Names list={line.own} />
                    </span>
                  )}
                  {line.below.length > 0 && (
                    <span className="block">
                      <Names list={line.below} /> from {from}
                    </span>
                  )}
                </span>
                <TriggerChevron />
              </>
            )}
          </PopoverTrigger>
          <PopoverPanel align="start" className="w-[min(18rem,calc(100vw-2rem))] p-3">
            <PopoverTitle className="px-1.5 pt-1 pb-1 text-[13px] font-semibold">Personas</PopoverTitle>
            <div className="flex flex-col">
              {personas.map((persona) => {
                const locked = sources.get(persona.id);
                const pressed = locked !== undefined || shown.has(persona.id);
                return (
                  <button
                    key={persona.id}
                    type="button"
                    aria-pressed={pressed}
                    aria-disabled={locked !== undefined}
                    aria-describedby={locked ? `persona-from-${persona.id}` : undefined}
                    onClick={() => {
                      if (locked === undefined) toggle(persona.id);
                    }}
                    className={`flex min-h-11 w-full items-center gap-2.5 rounded-sm px-1.5 py-1.5 text-start text-[14px] transition-colors duration-150 ease-out ${locked ? 'cursor-default' : 'cursor-pointer hover:bg-canvas'}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`grid size-4 shrink-0 place-items-center rounded-[3px] transition-colors duration-150 ease-out ${locked ? 'bg-ink/25 text-ink' : pressed ? 'bg-ink text-canvas shadow-raised' : 'bg-surface shadow-raised'}`}
                    >
                      {pressed && (
                        <svg viewBox="0 0 12 12" className="size-3">
                          <path
                            d="M2.5 6.5 5 9l4.5-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <PersonaGlyph icon={persona.icon} className="size-4 text-muted" />
                    <span className="flex min-w-0 grow flex-col">
                      <span className={locked ? 'text-muted' : undefined}>{persona.name}</span>
                      {locked && (
                        <span id={`persona-from-${persona.id}`} className="truncate text-[12px] text-muted">
                          {personaSourceLine(locked, noun)}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {sources.size > 0 && (
              <p className="mx-1.5 mt-2 border-t-(length:--hairline) border-line pt-2.5 text-[12px] leading-snug text-pretty text-muted">
                Greyed ticks are set on {from}. Change them there.
              </p>
            )}
          </PopoverPanel>
        </PopoverRoot>
        {failed && (
          <p role="alert" className="text-[13px] leading-snug text-pretty">
            That persona couldn’t be saved, so it hasn’t changed.
          </p>
        )}
      </dd>
    </>
  );
}
