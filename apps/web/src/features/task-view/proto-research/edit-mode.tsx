'use client';
// PROTOTYPE (#104). Throwaway. Direction 2, Edit mode: the page reads clean, and Edit research turns the whole
// section into a sorting board, where quotes are dragged onto the pain point they show and repeats are merged.
import { useLayoutEffect, useRef, useState } from 'react';
import type { PersonaView } from '@litmus/core';
import { Button } from '../../../ui/button';
import { TEXT_BOX } from '../../../ui/control';
import { PersonaGlyph } from '../../map/persona-icon';
import { SelectChevron } from '../../map/select-chevron';
import {
  BODY,
  CAPTION,
  EMPTY_QUOTE,
  FormActions,
  Plus,
  QuoteFields,
  QuoteRead,
  RemoveButton,
  Section,
  quoteFrom,
  quoteReady,
  submitOnCmdEnter,
  type QuoteDraft,
} from './parts';
import {
  likeness,
  ops,
  placeOf,
  short,
  soundsLike,
  voices,
  type PPain,
  type PQuote,
  type Place,
  type ResearchStore,
} from './store';

const QUIET = 'text-[14px] leading-snug text-pretty text-muted';
const FIELD = `${TEXT_BOX} min-h-0 resize-none`;
const DRAG = 'application/x-litmus-quote';

/** The page as it reads, before Edit research. */
function ReadView({ store, personas, kind }: { store: ResearchStore; personas: PersonaView[]; kind: string }) {
  const { summary, pains, loose, ideas } = store.research;
  if (summary === '' && pains.length === 0 && loose.length === 0 && ideas.length === 0)
    return <p className={QUIET}>No research on this {kind} yet.</p>;
  const quotes = (list: PQuote[]) => (
    <ul className="flex flex-col gap-3 border-s-2 border-line ps-4">
      {list.map((q) => (
        <li key={q.id}>
          <QuoteRead quote={q} personas={personas} />
        </li>
      ))}
    </ul>
  );
  return (
    <>
      {summary !== '' && (
        <Section id="em-summary" title="Summary">
          <p className={BODY}>{summary}</p>
        </Section>
      )}
      {(pains.length > 0 || loose.length > 0) && (
        <Section id="em-pains" title="Pain points">
          <ul className="flex flex-col">
            {pains.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 border-t-(length:--hairline) border-line py-4 first:border-t-0 first:pt-1"
              >
                <p className={BODY}>{p.text}</p>
                {p.quotes.length > 0 && quotes(p.quotes)}
              </li>
            ))}
          </ul>
          {loose.length > 0 && (
            <div className="flex flex-col gap-3 border-t-(length:--hairline) border-line pt-4">
              <p className={CAPTION}>Heard, but not yet placed under a pain point</p>
              {quotes(loose)}
            </div>
          )}
        </Section>
      )}
      {ideas.length > 0 && (
        <Section id="em-ideas" title={`How might we better support this ${kind}?`}>
          <ul className={`flex list-disc flex-col gap-2 ps-4 marker:text-muted ${BODY}`}>
            {ideas.map((i) => (
              <li key={i.id} className="ps-0.5">
                {i.text}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

function Grip() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
      {[5, 11].flatMap((x) =>
        [4, 8, 12].map((y) => <circle key={`${String(x)}-${String(y)}`} cx={x} cy={y} r="1.1" />),
      )}
    </svg>
  );
}

function Arrow({ up }: { up: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d={up ? 'M8 12.5v-9M4 7.5l4-4 4 4' : 'M8 3.5v9M4 8.5l4 4 4-4'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A growing field, for text edited on the board. */
function BoardField({
  value,
  label,
  onChange,
  className = '',
  autoFocus = false,
}: {
  value: string;
  label: string;
  onChange: (text: string) => void;
  className?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      aria-label={label}
      className={`${FIELD} [field-sizing:content] ${className}`}
      onChange={(e) => {
        onChange(e.target.value);
      }}
    />
  );
}

function QuoteCard({ quote, store, personas }: { quote: PQuote; store: ResearchStore; personas: PersonaView[] }) {
  const { research, set, change } = store;
  const at = placeOf(research, quote.id);
  const persona = personas.find((p) => p.id === quote.personaId);
  const [dragging, setDragging] = useState(false);
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG, quote.id);
        e.dataTransfer.effectAllowed = 'move';
        setDragging(true);
      }}
      onDragEnd={() => {
        setDragging(false);
      }}
      className={`flex flex-col gap-2 rounded-sm bg-canvas p-2 shadow-[inset_0_0_0_var(--hairline)_var(--line)] transition-opacity duration-150 ease-out ${dragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start gap-1.5">
        <span className="mt-2 cursor-grab text-muted active:cursor-grabbing" title="Drag onto a pain point">
          <Grip />
        </span>
        <BoardField
          value={quote.text}
          label={`What ${quote.participant} said`}
          className="bg-surface lg:text-[14px] lg:leading-[1.55]"
          onChange={(text) => {
            set(ops.editQuote(research, quote.id, { text }));
          }}
        />
        <RemoveButton
          label={`Remove the quote from ${quote.participant}`}
          onClick={() => {
            change(ops.removeQuote(research, quote.id), `Removed a quote from ${quote.participant}`);
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 ps-5">
        <span className="flex items-center gap-1.5 text-[13px] leading-snug text-muted">
          {persona && <PersonaGlyph icon={persona.icon} label={persona.name} />}
          {quote.participant}
        </span>
        <label className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="shrink-0 text-[13px] text-muted">Under</span>
          <span className="relative min-w-0 flex-1">
            <select
              value={at ?? ''}
              className="h-8 w-full min-w-0 cursor-pointer appearance-none truncate rounded-sm bg-surface ps-2 pe-7 text-base shadow-raised transition-colors duration-150 ease-out hover:bg-canvas max-lg:h-11 lg:text-[13px]"
              onChange={(e) => {
                const to = e.target.value === '' ? null : e.target.value;
                change(ops.moveQuote(research, quote.id, to), 'Moved a quote');
              }}
            >
              <option value="">Not yet placed</option>
              {research.pains.map((p) => (
                <option key={p.id} value={p.id}>
                  {short(p.text, 60)}
                </option>
              ))}
            </select>
            <SelectChevron />
          </span>
        </label>
      </div>
    </li>
  );
}

function useDrop(to: Place, store: ResearchStore) {
  const [over, setOver] = useState(false);
  return {
    over,
    handlers: {
      onDragOver: (e: React.DragEvent) => {
        if (!e.dataTransfer.types.includes(DRAG)) return;
        e.preventDefault();
        setOver(true);
      },
      onDragLeave: (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData(DRAG);
        if (id && placeOf(store.research, id) !== to)
          store.change(ops.moveQuote(store.research, id, to), 'Moved a quote');
      },
    },
  };
}

function AddQuoteForm({
  to,
  store,
  personas,
  onDone,
}: {
  to: Place;
  store: ResearchStore;
  personas: PersonaView[];
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<QuoteDraft>(EMPTY_QUOTE);
  return (
    <form
      className="flex flex-col gap-3 rounded-sm bg-canvas p-3 shadow-[inset_0_0_0_var(--hairline)_var(--line)]"
      onKeyDown={submitOnCmdEnter}
      onSubmit={(e) => {
        e.preventDefault();
        if (!quoteReady(draft)) return;
        store.change(
          ops.addQuote(store.research, quoteFrom(draft), to),
          `Added a quote from ${draft.participant.trim()}`,
        );
        onDone();
      }}
    >
      <QuoteFields draft={draft} onDraft={setDraft} personas={personas} boxed />
      <FormActions submit="Add quote" ready={quoteReady(draft)} onCancel={onDone} />
    </form>
  );
}

function PainCard({
  pain,
  index,
  store,
  personas,
  fresh,
}: {
  pain: PPain;
  index: number;
  store: ResearchStore;
  personas: PersonaView[];
  fresh: boolean;
}) {
  const { research, set, change } = store;
  const { over, handlers } = useDrop(pain.id, store);
  const [adding, setAdding] = useState(false);
  const twin = soundsLike(research, pain.text, pain.id, 0.4)[0];
  const count = research.pains.length;
  return (
    <li
      {...handlers}
      className={`flex flex-col gap-3 rounded-md bg-surface p-3 shadow-raised transition-[box-shadow] duration-150 ease-out ${over ? 'shadow-[0_0_0_2px_var(--ink)]' : ''}`}
    >
      <div className="flex items-start gap-1">
        <BoardField
          value={pain.text}
          label={`Pain point ${String(index + 1)}`}
          autoFocus={fresh}
          className="lg:text-[15px] lg:leading-[1.5]"
          onChange={(text) => {
            set(ops.editPain(research, pain.id, text));
          }}
        />
        <div className="flex shrink-0 items-center">
          <Button
            variant="quiet"
            shape="icon"
            aria-label="Move up"
            title="Move up"
            aria-disabled={index === 0}
            onClick={() => {
              if (index > 0) set(ops.movePain(research, pain.id, -1));
            }}
            className="aria-disabled:opacity-30"
          >
            <Arrow up />
          </Button>
          <Button
            variant="quiet"
            shape="icon"
            aria-label="Move down"
            title="Move down"
            aria-disabled={index === count - 1}
            onClick={() => {
              if (index < count - 1) set(ops.movePain(research, pain.id, 1));
            }}
            className="aria-disabled:opacity-30"
          >
            <Arrow up={false} />
          </Button>
          <RemoveButton
            label="Remove this pain point"
            onClick={() => {
              change(
                ops.removePain(research, pain.id),
                pain.quotes.length > 0
                  ? 'Removed a pain point. Its quotes are now waiting to be placed.'
                  : 'Removed a pain point',
              );
            }}
          />
        </div>
      </div>
      {twin && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-sm bg-sunken px-3 py-2 text-[13px] leading-snug">
          <p className="min-w-0 flex-1 text-pretty">
            Sounds like “{short(twin.text, 60)}”, with {voices(twin.quotes.length)}.
          </p>
          <Button
            variant="raised"
            onClick={() => {
              change(ops.mergePain(research, pain.id, twin.id), 'Merged two pain points');
            }}
          >
            Merge into it
          </Button>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {pain.quotes.map((q) => (
          <QuoteCard key={q.id} quote={q} store={store} personas={personas} />
        ))}
      </ul>
      {pain.quotes.length === 0 && !adding && (
        <p className={`rounded-sm border border-dashed border-line px-3 py-3 text-center ${CAPTION}`}>
          No voices yet. Drag a quote here, or add who said it.
        </p>
      )}
      {adding ? (
        <AddQuoteForm
          to={pain.id}
          store={store}
          personas={personas}
          onDone={() => {
            setAdding(false);
          }}
        />
      ) : (
        <Button
          variant="quiet"
          className="-ms-2 flex items-center gap-1.5 self-start"
          onClick={() => {
            setAdding(true);
          }}
        >
          <Plus />
          Add a voice
        </Button>
      )}
    </li>
  );
}

function Tray({ store, personas }: { store: ResearchStore; personas: PersonaView[] }) {
  const { over, handlers } = useDrop(null, store);
  const [adding, setAdding] = useState(false);
  const { loose } = store.research;
  return (
    <div
      {...handlers}
      className={`flex flex-col gap-3 rounded-md bg-sunken p-3 transition-[box-shadow] duration-150 ease-out ${over ? 'shadow-[0_0_0_2px_var(--ink)]' : ''}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-semibold">
          To place <span className="font-normal text-muted tabular-nums">{loose.length}</span>
        </h3>
        <p className="text-[13px] text-muted max-lg:hidden">Drag each onto the pain point it shows</p>
      </div>
      {loose.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {loose.map((q) => (
            <QuoteCard key={q.id} quote={q} store={store} personas={personas} />
          ))}
        </ul>
      ) : (
        <p className={CAPTION}>Every quote is under a pain point.</p>
      )}
      {adding ? (
        <AddQuoteForm
          to={null}
          store={store}
          personas={personas}
          onDone={() => {
            setAdding(false);
          }}
        />
      ) : (
        <Button
          variant="quiet"
          className="-ms-2 flex items-center gap-1.5 self-start"
          onClick={() => {
            setAdding(true);
          }}
        >
          <Plus />
          Add a quote
        </Button>
      )}
    </div>
  );
}

function Board({ store, personas, kind }: { store: ResearchStore; personas: PersonaView[]; kind: string }) {
  const { research, set, change } = store;
  const [fresh, setFresh] = useState<string | null>(null);
  const [newPain, setNewPain] = useState('');
  const [newIdea, setNewIdea] = useState('');
  const matches = soundsLike(research, newPain).slice(0, 2);
  const ideaTwin = research.ideas.find((i) => likeness(newIdea, i.text) >= 0.4);
  return (
    <>
      <Section id="em-summary" title="Summary">
        <label className="flex flex-col gap-1">
          <span className={CAPTION}>One to four sentences on what this {kind} is and why it’s hard</span>
          <BoardField
            value={research.summary}
            label="Summary"
            className="min-h-[4.5em] lg:text-[15px] lg:leading-[1.6]"
            onChange={(t) => {
              set(ops.setSummary(research, t));
            }}
          />
        </label>
      </Section>
      <Section id="em-pains" title="Pain points">
        <Tray store={store} personas={personas} />
        <ol className="flex flex-col gap-3">
          {research.pains.map((p, i) => (
            <PainCard key={p.id} pain={p} index={i} store={store} personas={personas} fresh={p.id === fresh} />
          ))}
        </ol>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const text = newPain.trim();
            if (text === '') return;
            const next = ops.addPain(research, text);
            change(next, 'Added a pain point');
            setNewPain('');
            setFresh(null);
          }}
        >
          <label className="flex flex-col gap-1">
            <span className={CAPTION}>New pain point</span>
            <div className="flex items-start gap-2">
              <input
                value={newPain}
                autoComplete="off"
                placeholder="What makes this hard, in a sentence"
                className={`${FIELD} h-8 min-h-0 flex-1 py-0 max-lg:h-11`}
                onChange={(e) => {
                  setNewPain(e.target.value);
                }}
              />
              <Button type="submit" variant="raised" aria-disabled={newPain.trim() === ''}>
                Add
              </Button>
            </div>
          </label>
          {matches.length > 0 && (
            <div role="status" className="flex flex-col gap-1 rounded-sm bg-sunken px-3 py-2 text-[13px] leading-snug">
              <p>Already on the board?</p>
              <ul className="flex flex-col gap-0.5 text-muted">
                {matches.map((m) => (
                  <li key={m.id}>
                    “{short(m.text, 70)}” · <span className="tabular-nums">{voices(m.quotes.length)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </Section>
      <Section id="em-ideas" title={`How might we better support this ${kind}?`}>
        <ul className="flex flex-col gap-2">
          {research.ideas.map((idea) => (
            <li key={idea.id} className="flex items-start gap-1">
              <BoardField
                value={idea.text}
                label="Idea"
                className="lg:text-[15px] lg:leading-[1.5]"
                onChange={(t) => {
                  set(ops.editIdea(research, idea.id, t));
                }}
              />
              <RemoveButton
                label="Remove this idea"
                onClick={() => {
                  change(ops.removeIdea(research, idea.id), 'Removed an idea');
                }}
              />
            </li>
          ))}
        </ul>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newIdea.trim() === '') return;
            change(ops.addIdea(research, newIdea.trim()), 'Added an idea');
            setNewIdea('');
          }}
        >
          <label className="flex flex-col gap-1">
            <span className={CAPTION}>New idea</span>
            <div className="flex items-start gap-2">
              <input
                value={newIdea}
                autoComplete="off"
                className={`${FIELD} h-8 min-h-0 flex-1 py-0 max-lg:h-11`}
                onChange={(e) => {
                  setNewIdea(e.target.value);
                }}
              />
              <Button type="submit" variant="raised" aria-disabled={newIdea.trim() === ''}>
                Add
              </Button>
            </div>
          </label>
          {ideaTwin && (
            <p role="status" className="rounded-sm bg-sunken px-3 py-2 text-[13px] leading-snug">
              Close to an idea you have: “{short(ideaTwin.text, 80)}”.
            </p>
          )}
        </form>
      </Section>
    </>
  );
}

export function EditMode({ store, personas, kind }: { store: ResearchStore; personas: PersonaView[]; kind: string }) {
  const [editing, setEditing] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const toggle = (on: boolean) => {
    setEditing(on);
    requestAnimationFrame(() => {
      top.current?.scrollIntoView({ block: 'nearest' });
      top.current?.querySelector('button')?.focus({ preventScroll: true });
    });
  };
  return (
    <div className="flex flex-col gap-10">
      <div
        ref={top}
        className={`flex items-center justify-between gap-3 border-y-(length:--hairline) border-line py-2 ${editing ? 'sticky top-0 z-10 bg-canvas' : ''}`}
      >
        <p className={CAPTION}>{editing ? 'Editing research. Changes save as you go.' : 'Research'}</p>
        <Button
          variant="raised"
          onClick={() => {
            toggle(!editing);
          }}
        >
          {editing ? 'Done' : 'Edit research'}
        </Button>
      </div>
      {editing ? (
        <Board store={store} personas={personas} kind={kind} />
      ) : (
        <ReadView store={store} personas={personas} kind={kind} />
      )}
    </div>
  );
}
