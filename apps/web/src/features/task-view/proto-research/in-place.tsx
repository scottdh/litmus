'use client';
// PROTOTYPE (#104). Throwaway. Direction 1, In place: every word is editable where it reads, with no modes.
import { useRef, useState } from 'react';
import type { PersonaView } from '@litmus/core';
import { Button } from '../../../ui/button';
import {
  BODY,
  CAPTION,
  EMPTY_QUOTE,
  FormActions,
  InPlaceText,
  MoveMenu,
  NewLine,
  Plus,
  QuoteFields,
  RemoveButton,
  Section,
  quoteFrom,
  quoteReady,
  submitOnCmdEnter,
  type QuoteDraft,
} from './parts';
import { PersonaGlyph } from '../../map/persona-icon';
import {
  likeness,
  ops,
  short,
  soundsLike,
  voices,
  type PPain,
  type PQuote,
  type Place,
  type ResearchStore,
} from './store';

// Controls that wait until the row is hovered or focused, and always show where there's no hover.
const REVEAL =
  'opacity-0 transition-opacity duration-150 ease-out group-hover/row:opacity-100 group-focus-within/row:opacity-100 pointer-coarse:opacity-100';

const ADD = 'flex items-center gap-1.5 self-start -ms-2';

function flash(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  el.querySelector('textarea')?.focus({ preventScroll: true });
}

/** A quiet note under a field, saying what it sounds like, before it's added. */
function Repeat({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="flex flex-col gap-1.5 rounded-sm bg-sunken px-3 py-2 text-[13px] leading-snug text-pretty"
    >
      {children}
    </div>
  );
}

function QuoteRow({
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
  const persona = personas.find((p) => p.id === quote.personaId);
  const suggested = soundsLike(research, quote.text, at ?? undefined).slice(0, 2);
  return (
    <li className="group/row flex flex-col gap-1">
      <div className="flex items-start gap-1">
        <span className="pt-px text-[14px] leading-[1.55] text-muted select-none" aria-hidden="true">
          “
        </span>
        <InPlaceText
          value={quote.text}
          label={`What ${quote.participant} said`}
          multiline
          className="-ms-1.5 text-[14px] leading-[1.55] text-pretty"
          onCommit={(text) => {
            set(ops.editQuote(research, quote.id, { text }));
          }}
          onEmpty={() => {
            change(ops.removeQuote(research, quote.id), `Removed a quote from ${quote.participant}`);
          }}
        />
      </div>
      <div className="flex min-h-8 flex-wrap items-center gap-x-1.5 ps-2.5">
        <span className="flex items-center gap-1.5 text-[13px] leading-snug text-muted">
          {persona && <PersonaGlyph icon={persona.icon} label={persona.name} />}
          {quote.participant}
        </span>
        <span className={`flex items-center ${REVEAL}`}>
          <MoveMenu
            label={`Move the quote from ${quote.participant}`}
            trigger="Move"
            at={at}
            pains={research.pains}
            suggested={suggested}
            onMove={(to) => {
              change(
                ops.moveQuote(research, quote.id, to),
                to === null ? 'Moved a quote to not yet placed' : 'Moved a quote',
              );
            }}
          />
          <RemoveButton
            label={`Remove the quote from ${quote.participant}`}
            onClick={() => {
              change(ops.removeQuote(research, quote.id), `Removed a quote from ${quote.participant}`);
            }}
          />
        </span>
      </div>
    </li>
  );
}

function AddQuote({
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
  const { research, change } = store;
  const [draft, setDraft] = useState<QuoteDraft>(EMPTY_QUOTE);
  const [target, setTarget] = useState<Place>(to);
  const match = soundsLike(research, draft.text, target ?? undefined)[0];
  return (
    <form
      className="flex flex-col gap-3 rounded-sm bg-surface p-3 shadow-raised"
      onKeyDown={submitOnCmdEnter}
      onSubmit={(e) => {
        e.preventDefault();
        if (!quoteReady(draft)) return;
        change(ops.addQuote(research, quoteFrom(draft), target), `Added a quote from ${draft.participant.trim()}`);
        onDone();
      }}
    >
      <QuoteFields draft={draft} onDraft={setDraft} personas={personas} />
      {match && (
        <Repeat>
          <p>
            Sounds like <span className="font-medium">“{short(match.text, 70)}”</span>, which has{' '}
            {voices(match.quotes.length)}.
          </p>
          <Button
            variant="raised"
            className="self-start"
            onClick={() => {
              setTarget(match.id);
            }}
          >
            Put it there instead
          </Button>
        </Repeat>
      )}
      {target !== to && (
        <p className={CAPTION}>
          Goes under “{short(research.pains.find((p) => p.id === target)?.text ?? '', 60)}”.{' '}
          <button
            type="button"
            className="cursor-pointer text-ink underline decoration-line underline-offset-3 hover:decoration-ink"
            onClick={() => {
              setTarget(to);
            }}
          >
            Keep it here
          </button>
        </p>
      )}
      <FormActions submit="Add quote" ready={quoteReady(draft)} onCancel={onDone} />
    </form>
  );
}

function Pain({ pain, store, personas }: { pain: PPain; store: ResearchStore; personas: PersonaView[] }) {
  const { research, set, change } = store;
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(pain.text);
  const twin = draft !== pain.text ? soundsLike(research, draft, pain.id, 0.4)[0] : undefined;
  return (
    <li
      id={`ip-${pain.id}`}
      className="flex flex-col gap-3 border-t-(length:--hairline) border-line py-4 first:border-t-0 first:pt-1"
    >
      <div className="group/row flex items-start gap-1">
        <InPlaceText
          value={pain.text}
          label="Pain point"
          className={BODY}
          onDraft={setDraft}
          onCommit={(text) => {
            set(ops.editPain(research, pain.id, text));
          }}
          onEmpty={() => {
            change(ops.removePain(research, pain.id), 'Removed a pain point. Its quotes are now not yet placed.');
          }}
        />
        <RemoveButton
          label="Remove this pain point"
          className={REVEAL}
          onClick={() => {
            change(
              ops.removePain(research, pain.id),
              pain.quotes.length > 0
                ? 'Removed a pain point. Its quotes are now not yet placed.'
                : 'Removed a pain point',
            );
          }}
        />
      </div>
      {twin && (
        <Repeat>
          <p>Close to another pain point: “{short(twin.text, 70)}”.</p>
        </Repeat>
      )}
      <div className="flex flex-col gap-3 border-s-2 border-line ps-4">
        {pain.quotes.length > 0 && (
          <ul className="flex flex-col gap-2">
            {pain.quotes.map((q) => (
              <QuoteRow key={q.id} quote={q} at={pain.id} store={store} personas={personas} />
            ))}
          </ul>
        )}
        {adding ? (
          <AddQuote
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
            className={ADD}
            onClick={() => {
              setAdding(true);
            }}
          >
            <Plus />
            {pain.quotes.length === 0 ? 'Add who said it' : 'Add a voice'}
          </Button>
        )}
      </div>
    </li>
  );
}

function AddPain({ store }: { store: ResearchStore }) {
  const { research, change } = store;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const matches = soundsLike(research, text).slice(0, 2);
  const close = () => {
    setText('');
    setOpen(false);
  };
  if (!open)
    return (
      <Button
        variant="quiet"
        className={ADD}
        onClick={() => {
          setOpen(true);
        }}
      >
        <Plus />
        Add a pain point
      </Button>
    );
  return (
    <div className="flex flex-col gap-2 border-t-(length:--hairline) border-line pt-4">
      <NewLine
        label="New pain point"
        placeholder="What makes this hard, in a sentence"
        value={text}
        onChange={setText}
        onCancel={close}
        onSubmit={() => {
          if (text.trim() !== '') change(ops.addPain(research, text.trim()), 'Added a pain point');
          close();
        }}
      />
      {matches.length > 0 ? (
        <Repeat>
          <p>Might already be here. Fewer, sharper pain points with a few voices each read better than many.</p>
          <ul className="flex flex-col gap-1">
            {matches.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className="cursor-pointer text-left text-ink underline decoration-line underline-offset-3 hover:decoration-ink"
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => {
                    close();
                    flash(`ip-${m.id}`);
                  }}
                >
                  {short(m.text, 80)}
                </button>{' '}
                <span className="text-muted tabular-nums">· {voices(m.quotes.length)}</span>
              </li>
            ))}
          </ul>
        </Repeat>
      ) : (
        <p className={CAPTION}>Enter adds it. Esc gives up.</p>
      )}
    </div>
  );
}

function Ideas({ store, kind }: { store: ResearchStore; kind: string }) {
  const { research, set, change } = store;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const close = () => {
    setText('');
    setOpen(false);
  };
  const twin = research.ideas.find((i) => likeness(text, i.text) >= 0.4);
  return (
    <Section id="ip-ideas" title={`How might we better support this ${kind}?`}>
      {research.ideas.length > 0 && (
        <ul className="flex flex-col gap-1">
          {research.ideas.map((idea) => (
            <li key={idea.id} className="group/row flex items-start gap-1">
              <span aria-hidden="true" className={`w-3 shrink-0 text-muted ${BODY}`}>
                •
              </span>
              <InPlaceText
                value={idea.text}
                label="Idea"
                className={BODY}
                onCommit={(t) => {
                  set(ops.editIdea(research, idea.id, t));
                }}
                onEmpty={() => {
                  change(ops.removeIdea(research, idea.id), 'Removed an idea');
                }}
              />
              <RemoveButton
                label="Remove this idea"
                className={REVEAL}
                onClick={() => {
                  change(ops.removeIdea(research, idea.id), 'Removed an idea');
                }}
              />
            </li>
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
            <Repeat>
              <p>Close to an idea you have: “{short(twin.text, 80)}”.</p>
            </Repeat>
          ) : (
            <p className={CAPTION}>Enter adds it and starts another. Esc finishes.</p>
          )}
        </div>
      ) : (
        <Button
          variant="quiet"
          className={ADD}
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

export function InPlace({ store, personas, kind }: { store: ResearchStore; personas: PersonaView[]; kind: string }) {
  const { research, set } = store;
  const [addingLoose, setAddingLoose] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <Section id="ip-summary" title="Summary">
        <div ref={summaryRef}>
          <InPlaceText
            value={research.summary}
            label="Summary"
            multiline
            placeholder={`One to four sentences on what this ${kind} is and why it’s hard`}
            className={BODY}
            onCommit={(t) => {
              set(ops.setSummary(research, t));
            }}
          />
        </div>
      </Section>
      <Section id="ip-pains" title="Pain points">
        {research.pains.length > 0 && (
          <ul className="flex flex-col">
            {research.pains.map((p) => (
              <Pain key={p.id} pain={p} store={store} personas={personas} />
            ))}
          </ul>
        )}
        <AddPain store={store} />
        <div className="flex flex-col gap-3 border-t-(length:--hairline) border-line pt-4">
          <p className={CAPTION}>Heard, but not yet placed under a pain point</p>
          {research.loose.length > 0 && (
            <ul className="flex flex-col gap-2 border-s-2 border-line ps-4">
              {research.loose.map((q) => (
                <QuoteRow key={q.id} quote={q} at={null} store={store} personas={personas} />
              ))}
            </ul>
          )}
          {addingLoose ? (
            <AddQuote
              to={null}
              store={store}
              personas={personas}
              onDone={() => {
                setAddingLoose(false);
              }}
            />
          ) : (
            <Button
              variant="quiet"
              className={ADD}
              onClick={() => {
                setAddingLoose(true);
              }}
            >
              <Plus />
              Add a quote
            </Button>
          )}
        </div>
      </Section>
      <Ideas store={store} kind={kind} />
    </>
  );
}
