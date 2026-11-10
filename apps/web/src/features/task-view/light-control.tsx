'use client';
import { useState } from 'react';
import { describeRating } from '../map/lights';
import { RatingSection, type ReviewDraft } from '../map/rating-section';
import type { Light } from '@litmus/core';
import type { Rate } from '../map/rename-result';

/** The drawer's rating control. Setting a light adds it to the history, and hands its Undo to the page. */
export function LightControl({
  mapId,
  id,
  name,
  light,
  review,
  rate,
  onRated,
}: {
  mapId: string;
  id: string;
  name: string;
  light: Light;
  review: string | null;
  rate: Rate;
  onRated: (change: { token: string; message: string }) => void;
}) {
  const [draft, setDraft] = useState<ReviewDraft | null>(null);
  return (
    <RatingSection
      mapId={mapId}
      id={id}
      light={light}
      review={review}
      draft={draft}
      onDraft={setDraft}
      reviewClassName="text-[15px] leading-[1.6]"
      rate={(input) =>
        rate(input).then((result) => {
          if (result.ok) onRated({ token: result.undoToken, message: describeRating(name, light, input.light) });
          return result;
        })
      }
    />
  );
}
