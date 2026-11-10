'use client';
import { LIGHTS, needsEvidence, type Light } from '@litmus/core';
import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Button } from '../../ui/button';
import { TEXT_BOX } from '../../ui/control';
import { LightMark } from './light-mark';
import { FILL_COLOUR, LIGHT_COPY, MARK_COLOUR } from './lights';
import type { Rate } from './rename-result';

export interface ReviewDraft {
  light: Light;
  note: string;
}

/** Where the picked light's centre sits across `group`, so the panel's notch can point at it. Null until measured. */
function usePickedCentre(group: RefObject<HTMLDivElement | null>, shown: Light) {
  const [centre, setCentre] = useState<number | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const picked = group.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (picked) setCentre(picked.offsetLeft + picked.offsetWidth / 2);
    };
    measure();
    // On a phone the lights share out the row, so the centre moves with its width.
    const row = group.current;
    if (!row) return;
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => {
      observer.disconnect();
    };
  }, [group, shown]);
  return centre;
}

/**
 * Pick a light, say why, then set it. The map keeps the old light until then. What the light means and its review sit
 * in one `sunken` panel whose notch points at the picked light, so the review reads as that light's reason and not as
 * the research under it.
 */
export function RatingSection({
  mapId,
  id,
  light,
  review,
  draft,
  rate,
  onDraft,
  reviewClassName = 'text-[14px] leading-snug',
}: {
  mapId: string;
  id: string;
  light: Light;
  review: string | null;
  draft: ReviewDraft | null;
  rate: Rate;
  onDraft: (draft: ReviewDraft | null) => void;
  /** The task view sets the review in its body size. */
  reviewClassName?: string;
}) {
  const section = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const shown = draft?.light ?? light;
  const missing = draft !== null && needsEvidence(draft.light) && draft.note.trim() === '';
  const centre = usePickedCentre(group, shown);

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
        <div ref={group} role="group" aria-label="Light" className="relative flex gap-1 max-lg:flex-5">
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
      </div>
      <div className="relative mt-1 flex w-full flex-col items-start gap-2.5 rounded-md bg-sunken p-3">
        {centre !== null && (
          <span
            aria-hidden="true"
            className="absolute -top-1 left-0 size-2.5 rotate-45 rounded-[2px] bg-sunken transition-[translate] duration-150 ease-out"
            style={{ translate: `${String(centre - 5)}px 0` }}
          />
        )}
        <p className="text-[13px] leading-snug text-pretty text-muted">{LIGHT_COPY[shown].meaning}</p>

        {draft === null ? (
          review !== null && <p className={`${reviewClassName} text-pretty whitespace-pre-wrap`}>{review}</p>
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
    </div>
  );
}
