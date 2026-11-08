'use client';
import { LIGHTS, needsEvidence, type Light } from '@litmus/core';
import { useRef, useState, type ReactNode } from 'react';
import { BUTTON, ICON_BUTTON, RAISED } from './button-style';
import { LightMark } from './light-mark';
import { FILL_COLOUR, LIGHT_COPY, MARK_COLOUR } from './lights';
import type { Rate } from './rename-result';

export interface ReviewDraft {
  light: Light;
  note: string;
}

/** Pick a light, say why, then set it. The map keeps the old light until then. */
export function RatingSection({
  mapId,
  id,
  light,
  review,
  draft,
  rate,
  onDraft,
  beside,
}: {
  mapId: string;
  id: string;
  light: Light;
  review: string | null;
  draft: ReviewDraft | null;
  rate: Rate;
  onDraft: (draft: ReviewDraft | null) => void;
  beside: ReactNode;
}) {
  const section = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const shown = draft?.light ?? light;
  const missing = draft !== null && needsEvidence(draft.light) && draft.note.trim() === '';

  // The form is going away, so keyboard users land on the light they're left with.
  const finish = () => {
    onDraft(null);
    setTried(false);
    setFailed(false);
    requestAnimationFrame(() => {
      section.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus();
    });
  };

  const save = async () => {
    if (draft === null || saving) return;
    if (missing) {
      setTried(true);
      return;
    }
    setSaving(true);
    setFailed(false);
    const result = await rate({ mapId, id, light: draft.light, note: draft.note }).catch(() => ({ ok: false }));
    setSaving(false);
    if (result.ok) finish();
    else setFailed(true);
  };

  return (
    <div ref={section} className="flex w-full flex-col items-start gap-2.5">
      <div className="flex w-full justify-between gap-3">
        <div role="group" aria-label="Light" className="flex gap-1 max-lg:flex-5">
          {LIGHTS.map((option) => {
            const chosen = option === shown;
            return (
              <button
                key={option}
                type="button"
                aria-label={LIGHT_COPY[option].label}
                title={LIGHT_COPY[option].label}
                aria-pressed={chosen}
                onClick={() => {
                  setTried(false);
                  setFailed(false);
                  onDraft({ light: option, note: draft?.note ?? '' });
                  requestAnimationFrame(() => field.current?.focus());
                }}
                className={`${ICON_BUTTON} ${chosen ? FILL_COLOUR[option] : `shadow-[inset_0_0_0_1px_var(--line)] ${MARK_COLOUR[option]}`}`}
              >
                <LightMark light={option} />
              </button>
            );
          })}
        </div>
        {beside}
      </div>
      <p className="text-[13px] leading-snug text-pretty text-muted">{LIGHT_COPY[shown].meaning}</p>

      {draft === null ? (
        review !== null && <p className="text-[14px] leading-snug text-pretty whitespace-pre-wrap">{review}</p>
      ) : (
        <>
          <label className="flex w-full flex-col gap-1 text-[13px]" htmlFor={`review-${id}`}>
            Review
          </label>
          <textarea
            ref={field}
            id={`review-${id}`}
            rows={3}
            value={draft.note}
            aria-invalid={tried && missing}
            aria-describedby={tried && missing ? `review-${id}-error` : undefined}
            onChange={(event) => {
              setTried(false);
              onDraft({ light: draft.light, note: event.target.value });
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                void save();
              }
              if (event.key === 'Escape') {
                // Marks it handled, so Esc only cancels this form.
                event.preventDefault();
                finish();
              }
            }}
            className="block min-h-[4.5em] w-full resize-y rounded-sm bg-canvas p-2 text-base leading-snug shadow-[inset_0_0_0_1px_var(--line)] [field-sizing:content] aria-invalid:outline-2 aria-invalid:outline-offset-2 aria-invalid:outline-mark-red lg:text-[14px]"
          />
          {tried && missing && (
            <p id={`review-${id}-error`} role="alert" className="text-[13px] leading-snug">
              Say why it’s {LIGHT_COPY[draft.light].label.toLowerCase()}, in a line or two.
            </p>
          )}
          {failed && (
            <p role="alert" className="text-[13px] leading-snug">
              That couldn’t be saved. Try again.
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-disabled={missing || saving}
              onClick={() => {
                void save();
              }}
              className={`${BUTTON} ${RAISED} aria-disabled:cursor-not-allowed aria-disabled:text-muted`}
            >
              {draft.light === light ? 'Save review' : `Set to ${LIGHT_COPY[draft.light].label.toLowerCase()}`}
            </button>
            <button type="button" onClick={finish} className={`${BUTTON} text-muted transition-colors hover:text-ink`}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
