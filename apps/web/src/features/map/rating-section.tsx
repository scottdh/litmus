'use client';
import { LIGHTS, needsEvidence, type Light } from '@litmus/core';
import { useRef, useState, type ReactNode } from 'react';
import { Button } from '../../ui/button';
import { TEXT_BOX } from '../../ui/control';
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
              <Button
                key={option}
                aria-label={LIGHT_COPY[option].label}
                title={LIGHT_COPY[option].label}
                aria-pressed={chosen}
                onClick={() => {
                  setTried(false);
                  setFailed(false);
                  onDraft({ light: option, note: draft?.note ?? '' });
                  requestAnimationFrame(() => field.current?.focus());
                }}
                variant={chosen ? 'fill' : 'raised'}
                shape="icon"
                className={chosen ? FILL_COLOUR[option] : MARK_COLOUR[option]}
              >
                <LightMark light={option} />
              </Button>
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
          <label className="text-[13px] text-muted" htmlFor={`review-${id}`}>
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
            className={TEXT_BOX}
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
            <Button
              aria-disabled={missing || saving}
              onClick={() => {
                void save();
              }}
              variant="raised"
            >
              {draft.light === light ? 'Save review' : `Set to ${LIGHT_COPY[draft.light].label.toLowerCase()}`}
            </Button>
            <Button onClick={finish} variant="quiet">
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
