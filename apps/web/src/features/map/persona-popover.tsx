'use client';
import type { ActivityView, PersonaView } from '@litmus/core';
import type { Ref } from 'react';
import { PopoverPanel, PopoverRoot, PopoverTitle, PopoverTrigger } from '../../ui/popover';
import { BUTTON } from './button-style';
import { PersonaGlyph } from './persona-icon';
import { personaTaskCount } from './personas';
import { PickRow } from './team-popover';

/** Picks whose work to show. Any number can be picked; everything else fades, and empty chapters fold away. */
export function PersonaPopover({
  personas,
  activities,
  picked,
  onToggle,
  triggerRef,
}: {
  personas: PersonaView[];
  activities: ActivityView[];
  picked: ReadonlySet<string>;
  onToggle: (id: string) => void;
  triggerRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <PopoverRoot>
      <PopoverTrigger ref={triggerRef} className={`${BUTTON} shrink-0 shadow-raised`}>
        Personas
      </PopoverTrigger>
      <PopoverPanel align="end" className="w-[min(18rem,calc(100vw-2rem))] p-3">
        <PopoverTitle className="px-1.5 pt-1 text-[13px] font-semibold">Show a persona’s tasks</PopoverTitle>
        <ul aria-label="Personas" className="mt-2 flex flex-col gap-0.5">
          {personas.map((persona) => (
            <li key={persona.id} className="flex">
              <PickRow
                name={persona.name}
                icon={<PersonaGlyph icon={persona.icon} className="size-4 text-muted" />}
                count={personaTaskCount(activities, persona.id)}
                pressed={picked.has(persona.id)}
                onToggle={() => {
                  onToggle(persona.id);
                }}
              />
            </li>
          ))}
        </ul>
        <p className="mx-1.5 mt-3 border-t-(length:--hairline) border-line pt-3 text-[12px] leading-snug text-pretty text-muted">
          A task counts if it, or any of its subtasks or steps, is theirs. Other tasks fade, and chapters with none of
          theirs fold away.
        </p>
      </PopoverPanel>
    </PopoverRoot>
  );
}
