'use client';
// PROTOTYPE (#104). Throwaway. Holds the research for the page, and shows it through the picked direction. Edits carry
// across directions, so they can be compared on the same content, and reset on reload.
import { UndoToast } from '../../map/undo-toast';
import type { TaskViewModel } from '../model';
import { EditMode } from './edit-mode';
import { InPlace } from './in-place';
import { useVariant } from './picker';
import { QuoteFirst } from './quote-first';
import { seed, useResearch } from './store';

const DIRECTIONS = [InPlace, EditMode, QuoteFirst];

export function ProtoResearch({ model }: { model: TaskViewModel }) {
  const store = useResearch(seed(model));
  const variant = useVariant();
  const Direction = DIRECTIONS[variant] ?? InPlace;
  return (
    <>
      <Direction key={variant} store={store} personas={model.allPersonas} kind={model.page.kind} />
      <p role="status" className="sr-only">
        {store.last?.message ?? ''}
      </p>
      <UndoToast
        token={store.last?.token ?? null}
        text={store.last?.message ?? ''}
        onUndo={store.undo}
        besideDrawer={false}
      />
    </>
  );
}
