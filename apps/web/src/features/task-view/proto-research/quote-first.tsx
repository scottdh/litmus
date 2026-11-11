'use client';
// PROTOTYPE (#104). Throwaway. Direction 3, Quote first: research comes in as what someone said. Each quote is placed
// under the pain point it shows before it lands, and a pain point starts from a quote. Everything else edits through
// a menu on the item.
import { useState } from 'react';
import type { PersonaView } from '@litmus/core';
import { Button } from '../../../ui/button';
import { TEXT_BOX, button } from '../../../ui/control';
import { PopoverClose, PopoverPanel, PopoverRoot, PopoverTitle, PopoverTrigger } from '../../../ui/popover';
import {
  BODY,
  CAPTION,
  EMPTY_QUOTE,
  FormActions,
  NewLine,
  Plus,
  QuoteFields,
  QuoteRead,
  Section,
  quoteFrom,
  quoteReady,
  submitOnCmdEnter,
  type QuoteDraft,
} from './parts';
import {
  likeness,
  newId,
  ops,
  short,
  soundsLike,
  voices,
  type PPain,
  type PQuote,
  type Place,
  type ResearchStore,
} from './store';

function Dots() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
      <circle cx="3.5" cy="8" r="1.2" />
      <circle cx="8" cy="8" r="1.2" />
      <circle cx="12.5" cy="8" r="1.2" />
    </svg>
  );
}

const MENU_ROW =
  'flex w-full cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-left text-[14px] leading-snug text-pretty transition-colors duration-150 ease-out hover:bg-canvas aria-disabled:cursor-default aria-disabled:text-muted aria-disabled:hover:bg-transparent max-lg:min-h-11';

/** Edit, place and remove, behind one quiet control on each item. */
function ItemMenu({
  label,
  onEdit,
  onRemove,
  removeLabel,
  place,
}: {
  label: string;
  onEdit: () => void;
  onRemove: () => void;
  removeLabel: string;
  place?: { at: Place; pains: PPain[]; suggested: PPain[]; onMove: (to: Place) => void };
}) {
  const [placing, setPlacing] = useState(false);
  const rest = place ? place.pains.filter((p) => !place.suggested.includes(p)) : [];
  const row = (pain: PPain) =>
    place && (
      <PopoverClose
        key={pain.id}
        aria-disabled={pain.id === place.at}
        className={MENU_ROW}
        onClick={() => {
          if (pain.id !== place.at) place.onMove(pain.id);
        }}
      >
        <span className="flex-1">{short(pain.text, 90)}</span>
        <span className="shrink-0 text-[12px] text-muted tabular-nums">
          {pain.id === place.at ? 'Here' : voices(pain.quotes.length)}
        </span>
      </PopoverClose>
    );
  return (
    <PopoverRoot
      onOpenChange={(open) => {
        if (!open) setPlacing(false);
      }}
    >
      <PopoverTrigger
        aria-label={label}
        title={label}
        className={`${button({ variant: 'quiet', shape: 'icon' })} shrink-0`}
      >
        <Dots />
      </PopoverTrigger>
      <PopoverPanel align="end" className={`p-1.5 ${placing ? 'w-[min(22rem,calc(100vw-2rem))]' : 'w-48'}`}>
        {placing && place ? (
          <>
            <PopoverTitle className="px-2 pt-1 pb-1.5 text-[13px] font-semibold">Place under</PopoverTitle>
            {place.suggested.length > 0 && (
              <>
                <p className="px-2 pb-1 text-[12px] text-muted">Sounds like</p>
                {place.suggested.map(row)}
                <div className="mx-2 my-1.5 border-t-(length:--hairline) border-line" />
              </>
            )}
            {rest.map(row)}
            <div className="mx-2 my-1.5 border-t-(length:--hairline) border-line" />
            <PopoverClose
              aria-disabled={place.at === null}
              className={MENU_ROW}
              onClick={() => {
                if (place.at !== null) place.onMove(null);
              }}
            >
              <span className="text-muted">Not yet placed</span>
            </PopoverClose>
          </>
        ) : (
          <>
            <PopoverClose className={MENU_ROW} onClick={onEdit}>
              Edit
            </PopoverClose>
            {place && (
              <button
                type="button"
                className={MENU_ROW}
                onClick={() => {
                  setPlacing(true);
                }}
              >
                Place under…
              </button>
            )}
            <div className="mx-2 my-1 border-t-(length:--hairline) border-line" />
            <PopoverClose className={`${MENU_ROW} text-danger`} onClick={onRemove}>
              {removeLabel}
            </PopoverClose>
          </>
        )}
      </PopoverPanel>
    </PopoverRoot>
  );
}

/** Editing one piece of text, with an explicit Save. */
function EditText({
  value,
  label,
  multiline = false,
  onSave,
  onCancel,
}: {
  value: string;
  label: string;
  multiline?: boolean;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(value);
  return (
    <form
      className="flex flex-col gap-2"
      onKeyDown={submitOnCmdEnter}
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim() !== '') onSave(text.trim());
      }}
    >
      <textarea
        autoFocus
        aria-label={label}
        value={text}
        rows={multiline ? 4 : 2}
        className={`${TEXT_BOX} min-h-0 lg:text-[15px] lg:leading-[1.6]`}
        onChange={(e) => {
          setText(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !multiline && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <FormActions submit="Save" ready={text.trim() !== ''} onCancel={onCancel} />
    </form>
  );
}

type Target = { kind: 'pain'; id: string } | { kind: 'new' } | { kind: 'hold' };

/** The one way in: what someone said, then where it goes. */
function Capture({ store, personas, onDone }: { store: ResearchStore; personas: PersonaView[]; onDone: () => void }) {
  const { research, change } = store;
  const [draft, setDraft] = useState<QuoteDraft>(EMPTY_QUOTE);
  const [picked, setPicked] = useState<Target | null>(null);
  const [painText, setPainText] = useState('');
  const [showAll, setShowAll] = useState(false);
  const suggested = soundsLike(research, draft.text).slice(0, 3);
  const target: Target = picked ?? (suggested[0] ? { kind: 'pain', id: suggested[0].id } : { kind: 'hold' });
  const others = research.pains.filter((p) => !suggested.includes(p));
  const painTwin = target.kind === 'new' ? soundsLike(research, painText, undefined, 0.4)[0] : undefined;
  const ready = quoteReady(draft) && (target.kind !== 'new' || painText.trim() !== '');
  const isPicked = (t: Target) =>
    t.kind === target.kind && (t.kind !== 'pain' || (target.kind === 'pain' && t.id === target.id));

  const choice = (t: Target, label: React.ReactNode, aside?: React.ReactNode) => (
    <label
      key={t.kind === 'pain' ? t.id : t.kind}
      className="flex cursor-pointer items-start gap-2.5 rounded-sm px-2 py-1.5 transition-colors duration-150 ease-out hover:bg-canvas max-lg:min-h-11"
    >
      <input
        type="radio"
        name="place"
        checked={isPicked(t)}
        className="mt-[0.3em] size-3.5 shrink-0 accent-(--ink)"
        onChange={() => {
          setPicked(t);
        }}
      />
      <span className="flex-1 text-[14px] leading-snug text-pretty">{label}</span>
      {aside && <span className="shrink-0 text-[12px] leading-[1.6] text-muted tabular-nums">{aside}</span>}
    </label>
  );

  return (
    <form
      className="flex flex-col gap-4 rounded-md bg-surface p-4 shadow-raised"
      onKeyDown={submitOnCmdEnter}
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        const quote = quoteFrom(draft);
        let next = research;
        let to: Place = null;
        if (target.kind === 'pain') to = target.id;
        if (target.kind === 'new') {
          to = newId('p');
          next = ops.addPain(next, painText.trim(), to);
        }
        next = ops.addQuote(next, quote, to);
        change(
          next,
          target.kind === 'new'
            ? `Added a pain point, with a quote from ${quote.participant}`
            : target.kind === 'hold'
              ? `Added a quote from ${quote.participant}, not yet placed`
              : `Added a quote from ${quote.participant}`,
        );
        onDone();
      }}
    >
      <QuoteFields draft={draft} onDraft={setDraft} personas={personas} />
      <fieldset className="flex flex-col gap-1">
        <legend className={`${CAPTION} pb-1.5`}>Place it under</legend>
        {suggested.length > 0 && (
          <>
            <p className="px-2 pb-0.5 text-[12px] text-muted">Sounds like</p>
            {suggested.map((p) => choice({ kind: 'pain', id: p.id }, p.text, voices(p.quotes.length)))}
          </>
        )}
        {others.length > 0 &&
          (showAll || (target.kind === 'pain' && others.some((p) => p.id === target.id)) ? (
            <>
              {suggested.length > 0 && <p className="px-2 pt-1.5 pb-0.5 text-[12px] text-muted">Other pain points</p>}
              {others.map((p) => choice({ kind: 'pain', id: p.id }, p.text, voices(p.quotes.length)))}
            </>
          ) : (
            <button
              type="button"
              className="cursor-pointer self-start rounded-sm px-2 py-1.5 text-[14px] text-muted transition-colors duration-150 ease-out hover:text-ink max-lg:min-h-11"
              onClick={() => {
                setShowAll(true);
              }}
            >
              {suggested.length > 0 ? 'Another pain point' : 'A pain point'} ({others.length})
            </button>
          ))}
        <div className="my-1 border-t-(length:--hairline) border-line" />
        {choice({ kind: 'new' }, 'A new pain point')}
        {target.kind === 'new' && (
          <div className="flex flex-col gap-2 ps-8 pb-1">
            <NewLine
              label="The new pain point"
              placeholder="What it shows, in your words"
              value={painText}
              onChange={setPainText}
              onSubmit={() => {
                if (ready) document.activeElement?.closest('form')?.requestSubmit();
              }}
              onCancel={() => {
                setPicked({ kind: 'hold' });
              }}
            />
            {painTwin && (
              <p role="status" className="rounded-sm bg-sunken px-3 py-2 text-[13px] leading-snug text-pretty">
                Close to “{short(painTwin.text, 70)}”, with {voices(painTwin.quotes.length)}.{' '}
                <button
                  type="button"
                  className="cursor-pointer text-ink underline decoration-line underline-offset-3 hover:decoration-ink"
                  onClick={() => {
                    setPicked({ kind: 'pain', id: painTwin.id });
                  }}
                >
                  Place it there
                </button>
              </p>
            )}
          </div>
        )}
        {choice({ kind: 'hold' }, <span className="text-muted">Not yet. Hold it to place later</span>)}
      </fieldset>
      <FormActions submit="Add quote" ready={ready} onCancel={onDone} />
    </form>
  );
}

function QuoteItem({
  quote,
  at,
  store,
  personas,
}: {
  quote: PQuote;
  at: Place;
  store: ResearchStore;
  personas: PersonaView[];
}) {
  const { research, set, change } = store;
  const [editing, setEditing] = useState(false);
  if (editing)
    return (
      <li>
        <EditText
          value={quote.text}
          label={`What ${quote.participant} said`}
          multiline
          onSave={(text) => {
            set(ops.editQuote(research, quote.id, { text }));
            setEditing(false);
          }}
          onCancel={() => {
            setEditing(false);
          }}
        />
      </li>
    );
  return (
    <li className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <QuoteRead quote={quote} personas={personas} />
      </div>
      <ItemMenu
        label={`Quote from ${quote.participant}`}
        removeLabel="Remove quote"
        onEdit={() => {
          setEditing(true);
        }}
        onRemove={() => {
          change(ops.removeQuote(research, quote.id), `Removed a quote from ${quote.participant}`);
        }}
        place={{
          at,
          pains: research.pains,
          suggested: soundsLike(research, quote.text, at ?? undefined).slice(0, 2),
          onMove: (to) => {
            change(ops.moveQuote(research, quote.id, to), 'Moved a quote');
          },
        }}
      />
    </li>
  );
}

function PainItem({ pain, store, personas }: { pain: PPain; store: ResearchStore; personas: PersonaView[] }) {
  const { research, set, change } = store;
  const [editing, setEditing] = useState(false);
  return (
    <li className="flex flex-col gap-3 border-t-(length:--hairline) border-line py-4 first:border-t-0 first:pt-1">
      {editing ? (
        <EditText
          value={pain.text}
          label="Pain point"
          onSave={(text) => {
            set(ops.editPain(research, pain.id, text));
            setEditing(false);
          }}
          onCancel={() => {
            setEditing(false);
          }}
        />
      ) : (
        <div className="flex items-start gap-2">
          <p className={`flex-1 ${BODY}`}>{pain.text}</p>
          <span className="shrink-0 pt-0.5 text-[12px] leading-[1.6] text-muted tabular-nums">
            {pain.quotes.length === 0 ? 'No voices yet' : voices(pain.quotes.length)}
          </span>
          <ItemMenu
            label="Pain point"
            removeLabel="Remove pain point"
            onEdit={() => {
              setEditing(true);
            }}
            onRemove={() => {
              change(
                ops.removePain(research, pain.id),
                pain.quotes.length > 0
                  ? 'Removed a pain point. Its quotes are now not yet placed.'
                  : 'Removed a pain point',
              );
            }}
          />
        </div>
      )}
      {pain.quotes.length > 0 && (
        <ul className="flex flex-col gap-3 border-s-2 border-line ps-4">
          {pain.quotes.map((q) => (
            <QuoteItem key={q.id} quote={q} at={pain.id} store={store} personas={personas} />
          ))}
        </ul>
      )}
    </li>
  );
}

function Summary({ store, kind }: { store: ResearchStore; kind: string }) {
  const { research, set } = store;
  const [editing, setEditing] = useState(false);
  return (
    <Section
      id="qf-summary"
      title="Summary"
      action={
        !editing && (
          <Button
            variant="quiet"
            onClick={() => {
              setEditing(true);
            }}
          >
            {research.summary === '' ? 'Write one' : 'Edit'}
          </Button>
        )
      }
    >
      {editing ? (
        <EditText
          value={research.summary}
          label="Summary"
          multiline
          onSave={(text) => {
            set(ops.setSummary(research, text));
            setEditing(false);
          }}
          onCancel={() => {
            setEditing(false);
          }}
        />
      ) : research.summary === '' ? (
        <p className="text-[14px] leading-snug text-muted">
          One to four sentences on what this {kind} is and why it’s hard.
        </p>
      ) : (
        <p className={BODY}>{research.summary}</p>
      )}
    </Section>
  );
}

function IdeaItem({ id, text, store }: { id: string; text: string; store: ResearchStore }) {
  const { research, set, change } = store;
  const [editing, setEditing] = useState(false);
  if (editing)
    return (
      <li className="list-none">
        <EditText
          value={text}
          label="Idea"
          onSave={(t) => {
            set(ops.editIdea(research, id, t));
            setEditing(false);
          }}
          onCancel={() => {
            setEditing(false);
          }}
        />
      </li>
    );
  return (
    <li className="ps-0.5">
      <div className="flex items-start gap-2">
        <span className="flex-1">{text}</span>
        <ItemMenu
          label="Idea"
          removeLabel="Remove idea"
          onEdit={() => {
            setEditing(true);
          }}
          onRemove={() => {
            change(ops.removeIdea(research, id), 'Removed an idea');
          }}
        />
      </div>
    </li>
  );
}

function Ideas({ store, kind }: { store: ResearchStore; kind: string }) {
  const { research, change } = store;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const twin = research.ideas.find((i) => likeness(text, i.text) >= 0.4);
  const close = () => {
    setText('');
    setOpen(false);
  };
  return (
    <Section id="qf-ideas" title={`How might we better support this ${kind}?`}>
      {research.ideas.length > 0 && (
        <ul className={`flex list-disc flex-col gap-1 ps-4 marker:text-muted ${BODY}`}>
          {research.ideas.map((i) => (
            <IdeaItem key={i.id} id={i.id} text={i.text} store={store} />
          ))}
        </ul>
      )}
      {open ? (
        <div className="flex flex-col gap-2">
          <NewLine
            label="New idea"
            placeholder="An idea, in a sentence"
            value={text}
            onChange={setText}
            onCancel={close}
            onSubmit={() => {
              if (text.trim() !== '') change(ops.addIdea(research, text.trim()), 'Added an idea');
              setText('');
            }}
          />
          {twin ? (
            <p role="status" className="rounded-sm bg-sunken px-3 py-2 text-[13px] leading-snug">
              Close to an idea you have: “{short(twin.text, 80)}”.
            </p>
          ) : (
            <p className={CAPTION}>Enter adds it and starts another. Esc finishes.</p>
          )}
        </div>
      ) : (
        <Button
          variant="quiet"
          className="-ms-2 flex items-center gap-1.5 self-start"
          onClick={() => {
            setOpen(true);
          }}
        >
          <Plus />
          Add an idea
        </Button>
      )}
    </Section>
  );
}

export function QuoteFirst({ store, personas, kind }: { store: ResearchStore; personas: PersonaView[]; kind: string }) {
  const { research } = store;
  const [capturing, setCapturing] = useState(false);
  return (
    <>
      <Summary store={store} kind={kind} />
      <Section
        id="qf-pains"
        title="Pain points"
        action={
          !capturing && (
            <Button
              variant="raised"
              className="flex items-center gap-1.5"
              onClick={() => {
                setCapturing(true);
              }}
            >
              <Plus />
              Add what you heard
            </Button>
          )
        }
      >
        {capturing && (
          <Capture
            store={store}
            personas={personas}
            onDone={() => {
              setCapturing(false);
            }}
          />
        )}
        {research.pains.length === 0 && research.loose.length === 0 && !capturing && (
          <p className="text-[14px] leading-snug text-muted">
            Nothing heard yet. Add a quote, and its pain point grows from it.
          </p>
        )}
        {research.pains.length > 0 && (
          <ul className="flex flex-col">
            {research.pains.map((p) => (
              <PainItem key={p.id} pain={p} store={store} personas={personas} />
            ))}
          </ul>
        )}
        {research.loose.length > 0 && (
          <div className="flex flex-col gap-3 border-t-(length:--hairline) border-line pt-4">
            <p className={CAPTION}>Heard, but not yet placed under a pain point</p>
            <ul className="flex flex-col gap-3 border-s-2 border-line ps-4">
              {research.loose.map((q) => (
                <QuoteItem key={q.id} quote={q} at={null} store={store} personas={personas} />
              ))}
            </ul>
          </div>
        )}
      </Section>
      <Ideas store={store} kind={kind} />
    </>
  );
}
