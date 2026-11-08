'use client';
import type { ActivityView, PersonaView } from '@litmus/core';
import { useState, type Ref } from 'react';
import { PopoverPanel, PopoverRoot, PopoverTitle, PopoverTrigger } from '../../ui/popover';
import { AddControl } from './add-field';
import { BUTTON, RAISED } from './button-style';
import { PersonaGlyph } from './persona-icon';
import { personaTaskCount } from './personas';
import { PickRow, OPEN_BUTTON } from './pick-row';

/**
 * Picks whose work to show. Any number can be picked; everything else fades, and empty chapters fold away.
 * It's also where personas are added, and where Open shows a persona in the drawer.
 */
export function PersonaPopover({
  personas,
  activities,
  picked,
  onToggle,
  onOpen,
  onAdd,
  triggerRef,
}: {
  personas: PersonaView[];
  activities: ActivityView[];
  picked: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  onAdd: (name: string) => void;
  triggerRef?: Ref<HTMLButtonElement>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <PopoverRoot
      open={open}
      onOpenChange={(next, details) => {
        // Esc in the Add persona field ends only the field, which marks the key as used.
        if (!next && details.reason === 'escape-key' && details.event.defaultPrevented) {
          details.cancel();
          return;
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger ref={triggerRef} className={`${BUTTON} ${RAISED} shrink-0`}>
        Personas
      </PopoverTrigger>
      <PopoverPanel align="end" className="w-[min(18rem,calc(100vw-2rem))] p-3">
        <PopoverTitle className="px-1.5 pt-1 text-[13px] font-semibold">Show a persona’s tasks</PopoverTitle>
        <ul aria-label="Personas" className="mt-2 flex flex-col gap-0.5">
          {personas.map((persona) => (
            <li key={persona.id} className="group/pick flex items-center gap-1">
              <PickRow
                name={persona.name}
                icon={<PersonaGlyph icon={persona.icon} className="size-4 text-muted" />}
                count={personaTaskCount(activities, persona.id)}
                pressed={picked.has(persona.id)}
                onToggle={() => {
                  onToggle(persona.id);
                }}
              />
              <button
                type="button"
                aria-label={`Open ${persona.name}`}
                onClick={() => {
                  setOpen(false);
                  onOpen(persona.id);
                }}
                className={OPEN_BUTTON}
              >
                Open
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-1 flex min-h-10 items-center px-1.5">
          <AddControl
            action="Add persona"
            label="New persona name"
            placeholder="Persona name"
            buttonClassName="-ms-2 text-muted hover:text-ink"
            fieldClassName="py-2 text-base leading-[1.35] lg:text-[14px]"
            onAdd={onAdd}
          />
        </div>
        {personas.length > 0 && (
          <p className="mx-1.5 mt-3 border-t-(length:--hairline) border-line pt-3 text-[12px] leading-snug text-pretty text-muted">
            A task counts if it, or any of its subtasks or steps, is theirs. Other tasks fade, and chapters with none of
            theirs fold away.
          </p>
        )}
      </PopoverPanel>
    </PopoverRoot>
  );
}
