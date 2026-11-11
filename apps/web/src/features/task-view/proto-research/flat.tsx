'use client';
// PROTOTYPE (#104). Throwaway. Direction 4, Flat: pain points and voices are two plain lists, edited in place, with no
// placing. A voice is never under a pain point here, so every quote in the store shows as one list, wherever it lives.
import { useState } from 'react';
import type { PersonaView } from '@litmus/core';
import { Button } from '../../../ui/button';
import { PersonaGlyph } from '../../map/persona-icon';
import {
  BODY,
  CAPTION,
  EMPTY_QUOTE,
  FormActions,
  InPlaceText,
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
import { likeness, ops, short, type PItem, type PQuote, type ResearchStore } from './store';

const REVEAL =
  'opacity-0 transition-opacity duration-150 ease-out group-hover/row:opacity-100 group-focus-within/row:opacity-100 pointer-coarse:opacity-100';
const ADD = 'flex items-center gap-1.5 self-start -ms-2';
// The × keeps its size beside a line of text, and doesn't push the rows apart, so the lists read like the drawer's.
const X = `${REVEAL} max-lg:w-11 max-lg:flex-none -my-1 max-lg:-my-2.5`;

// Past these, a quiet line suggests sharpening rather than adding. Nothing stops another.
const MANY_PAINS = 5;
const MANY_VOICES = 6;

const allVoices = (store: ResearchStore) => [...store.research.pains.flatMap((p) => p.quotes), ...store.research.loose];

/** The closest thing already written, if it's close enough to be a repeat. */
function closest<T>(items: T[], text: string, of: (item: T) => string, exceptId?: string, threshold = 0.4) {
  if (text.trim().split(/\s+/).length < 3) return undefined;
  return items
    .filter((item) => (item as { id: string }).id !== exceptId)
    .map((item) => ({ item, score: likeness(text, of(item)) }))
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)[0]?.item;
}

/** The drawer's list marker: a small muted disc, centred on the first line. */
function Disc() {
  return (
    <span aria-hidden="true" className="flex h-6 w-3.5 shrink-0 items-center">
      <span className="size-[5px] rounded-full bg-muted" />
    </span>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="flex flex-col gap-1.5 rounded-sm bg-sunken px-3 py-2 text-[13px] leading-snug text-pretty"
    >
      {children}
    </div>
  );
}

function Pains({ store }: { store: ResearchStore }) {
  const { research, set, change } = store;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const twin = closest(research.pains, text, (p) => p.text);
  const close = () => {
    setText('');
    setOpen(false);
  };
  return (
    <Section id="fl-pains" title="Pain points">
      {research.pains.length > 0 && (
        <ul className="flex flex-col gap-1">
          {research.pains.map((pain) => (
            <li key={pain.id} className="group/row flex items-start gap-1">
              <Disc />
              <InPlaceText
                value={pain.text}
                label="Pain point"
                className={BODY}
                onCommit={(t) => {
                  set(ops.editPain(research, pain.id, t));
                }}
                onEmpty={() => {
                  change(ops.removePain(research, pain.id), 'Removed a pain point');
                }}
              />
              <RemoveButton
                label="Remove this pain point"
                className={X}
                onClick={() => {
                  change(ops.removePain(research, pain.id), 'Removed a pain point');
                }}
              />
            </li>
          ))}
        </ul>
      )}
      {open ? (
        <div className="flex flex-col gap-2">
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
          {twin ? (
            <Note>
              <p>
                Close to one you have: <span className="font-medium">“{short(twin.text, 80)}”</span>. Sharpen that one
                instead?
              </p>
            </Note>
          ) : (
            <p className={CAPTION}>Enter adds it. Esc gives up.</p>
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
          Add a pain point
        </Button>
      )}
      {research.pains.length > MANY_PAINS && (
        <p className={CAPTION}>{research.pains.length} pain points. Fewer, sharper ones read better than many.</p>
      )}
    </Section>
  );
}

function Voice({ quote, store, personas }: { quote: PQuote; store: ResearchStore; personas: PersonaView[] }) {
  const { research, set, change } = store;
  const persona = personas.find((p) => p.id === quote.personaId);
  const remove = () => {
    change(ops.removeQuote(research, quote.id), `Removed what ${quote.participant} said`);
  };
  return (
    <li className="group/row flex items-start gap-1">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="relative">
          <span aria-hidden="true" className="absolute -start-[0.4em] top-0 text-[14px] leading-[1.55] select-none">
            “
          </span>
          <InPlaceText
            value={quote.text}
            label={`What ${quote.participant} said`}
            multiline
            className="text-[14px] leading-[1.55] text-pretty"
            onCommit={(text) => {
              set(ops.editQuote(research, quote.id, { text }));
            }}
            onEmpty={remove}
          />
        </div>
        <span className="flex items-center gap-1.5 text-[13px] leading-snug text-muted">
          {persona && <PersonaGlyph icon={persona.icon} label={persona.name} />}
          {quote.participant}
        </span>
      </div>
      <RemoveButton label={`Remove what ${quote.participant} said`} className={X} onClick={remove} />
    </li>
  );
}

function AddVoice({ store, personas, onDone }: { store: ResearchStore; personas: PersonaView[]; onDone: () => void }) {
  const { research, change } = store;
  const [draft, setDraft] = useState<QuoteDraft>(EMPTY_QUOTE);
  const twin = closest(allVoices(store), draft.text, (q) => q.text);
  return (
    <form
      className="flex flex-col gap-3 rounded-sm bg-surface p-3 shadow-raised"
      onKeyDown={submitOnCmdEnter}
      onSubmit={(e) => {
        e.preventDefault();
        if (!quoteReady(draft)) return;
        change(ops.addQuote(research, quoteFrom(draft), null), `Added what ${draft.participant.trim()} said`);
        onDone();
      }}
    >
      <QuoteFields draft={draft} onDraft={setDraft} personas={personas} />
      {twin && (
        <Note>
          <p>
            Sounds like what {twin.participant} said: <span className="font-medium">“{short(twin.text, 80)}”</span>. Add
            it only if it says something new.
          </p>
        </Note>
      )}
      <FormActions submit="Add" ready={quoteReady(draft)} onCancel={onDone} />
    </form>
  );
}

function Voices({ store, personas }: { store: ResearchStore; personas: PersonaView[] }) {
  const [adding, setAdding] = useState(false);
  const list = allVoices(store);
  return (
    <Section id="fl-voices" title="What we’re hearing">
      {list.length > 0 && (
        <ul className="flex flex-col gap-4">
          {list.map((q) => (
            <Voice key={q.id} quote={q} store={store} personas={personas} />
          ))}
        </ul>
      )}
      {adding ? (
        <AddVoice
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
          Add what someone said
        </Button>
      )}
      {list.length > MANY_VOICES && (
        <p className={CAPTION}>{list.length} voices. A few that say it clearly beat many that say it twice.</p>
      )}
    </Section>
  );
}

function Ideas({ store, kind }: { store: ResearchStore; kind: string }) {
  const { research, set, change } = store;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const twin = closest<PItem>(research.ideas, text, (i) => i.text);
  const close = () => {
    setText('');
    setOpen(false);
  };
  return (
    <Section id="fl-ideas" title={`How might we better support this ${kind}?`}>
      {research.ideas.length > 0 && (
        <ul className="flex flex-col gap-1">
          {research.ideas.map((idea) => (
            <li key={idea.id} className="group/row flex items-start gap-1">
              <Disc />
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
                className={X}
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
            <Note>
              <p>Close to an idea you have: “{short(twin.text, 80)}”.</p>
            </Note>
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

export function Flat({ store, personas, kind }: { store: ResearchStore; personas: PersonaView[]; kind: string }) {
  const { research, set } = store;
  return (
    <>
      <Section id="fl-summary" title="Summary">
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
      </Section>
      <Pains store={store} />
      <Voices store={store} personas={personas} />
      <Ideas store={store} kind={kind} />
    </>
  );
}
