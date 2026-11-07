'use client';
import { PERSONA_ICONS, type PersonaIcon } from '@litmus/core';
import { useState } from 'react';
import { PersonaGlyph } from './persona-icon';

/** A persona's icon, picked from the fixed set. A change shows at once and saves at once. */
export function PersonaIconField({
  icon,
  onChange,
}: {
  icon: PersonaIcon;
  onChange: (icon: PersonaIcon) => Promise<{ ok: boolean }>;
}) {
  // Shows the choice at once, rather than waiting for the map to come back from the server.
  const [shown, setShown] = useState(icon);
  const [failed, setFailed] = useState(false);

  const pick = (next: PersonaIcon) => {
    const before = shown;
    // Only puts the old icon back if nothing newer has been picked since.
    const undo = () => {
      setShown((current) => (current === next ? before : current));
      setFailed(true);
    };
    setFailed(false);
    setShown(next);
    void onChange(next).then((result) => {
      if (!result.ok) undo();
    }, undo);
  };

  return (
    <fieldset className="flex w-full flex-col gap-2">
      <legend className="mb-2 text-[13px] text-muted">Icon</legend>
      <div className="flex flex-wrap gap-1.5">
        {PERSONA_ICONS.map((option) => (
          <label
            key={option}
            className="relative grid size-8 cursor-pointer place-items-center rounded-sm text-muted shadow-raised transition-[background-color,color,scale] duration-150 ease-out hover:text-ink active:scale-[0.96] has-checked:bg-ink has-checked:text-canvas has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink max-lg:size-11"
          >
            <input
              type="radio"
              name="persona-icon"
              value={option}
              checked={shown === option}
              onChange={() => {
                pick(option);
              }}
              aria-label={option}
              className="sr-only"
            />
            <PersonaGlyph icon={option} className="size-4" />
          </label>
        ))}
      </div>
      {failed && (
        <p role="alert" className="text-[13px] text-pretty text-muted">
          That icon couldn’t be saved, so it hasn’t changed.
        </p>
      )}
    </fieldset>
  );
}
