'use client';
import { useState } from 'react';
import type { RenameResult } from './rename-result';

/** Leaving saves, and Cmd+Enter does too. Esc puts back what's saved, or lets the drawer close if nothing changed. */
export function NoteField({
  id,
  value,
  onSave,
}: {
  id: string;
  value: string;
  onSave: (note: string) => Promise<RenameResult>;
}) {
  const [draft, setDraft] = useState(value);
  const [failed, setFailed] = useState(false);

  const save = () => {
    if (draft.trim() === value) return;
    setFailed(false);
    void onSave(draft).then(
      (result) => {
        setFailed(!result.ok);
      },
      () => {
        setFailed(true);
      },
    );
  };

  return (
    <div className="flex w-full flex-col gap-1">
      <label className="text-[13px]" htmlFor={`note-${id}`}>
        Notes
      </label>
      <textarea
        id={`note-${id}`}
        rows={3}
        value={draft}
        placeholder="Research, decisions, anything this step needs."
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            event.currentTarget.blur();
          }
          if (event.key === 'Escape' && draft !== value) {
            // Marks it handled, so this Esc only undoes the typing.
            event.preventDefault();
            setDraft(value);
          }
        }}
        className="block min-h-[4.5em] w-full resize-y rounded-sm bg-canvas p-2 text-base leading-snug shadow-[inset_0_0_0_1px_var(--line)] [field-sizing:content] placeholder:text-muted lg:text-[14px]"
      />
      {failed && (
        <p role="alert" className="text-[13px] leading-snug">
          That note couldn’t be saved. Your text is still here, so try again.
        </p>
      )}
    </div>
  );
}
