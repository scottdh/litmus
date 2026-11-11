'use client';
import { useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { PersonaId, PersonaView, QuoteView, ResearchEdit, ResearchItemView } from '@litmus/core';
import { Button } from '../../ui/button';
import { SELECT, TEXT_BOX } from '../../ui/control';
import { AddField } from '../map/add-field';
import { PersonaGlyph } from '../map/persona-icon';
import { SelectChevron } from '../map/select-chevron';
import { growingLine, researchMessage, type EditResearch, type ResearchList, type TaskViewModel } from './model';
import { excerpt, findRepeat } from './repeats';
import { Section } from './sections';

interface Draft {
  summary: string;
  pains: ResearchItemView[];
  hearing: QuoteView[];
  ideas: ResearchItemView[];
}

const fromModel = (model: TaskViewModel): Draft => ({
  summary: model.summary ?? '',
  pains: model.pains,
  hearing: model.hearing,
  ideas: model.ideas,
});

const POINTS = 'text-base leading-[1.6] text-pretty lg:text-[15px]';
const QUOTE = 'text-base leading-[1.55] text-pretty lg:text-[14px]';
const HINT = 'text-[13px] leading-snug text-pretty text-muted';

// Reads as text until hovered or focused. Pulled out by its padding, so the words line up with the column.
const IN_PLACE =
  '-mx-1.5 block w-[calc(100%+0.75rem)] resize-none overflow-hidden [field-sizing:content] rounded-sm bg-transparent px-1.5 py-0.5 transition-[background-color,box-shadow] duration-150 ease-out placeholder:text-muted hover:bg-sunken focus:bg-canvas focus:shadow-[inset_0_0_0_1px_var(--ink)] focus-visible:outline-none';

const stripQuoteMarks = (text: string) =>
  text
    .trim()
    .replace(/^["“”'‘’]+|["“”'‘’]+$/g, '')
    .trim();

const isModEnter = (event: { key: string; metaKey: boolean; ctrlKey: boolean }) =>
  event.key === 'Enter' && (event.metaKey || event.ctrlKey);

/** Grows with its text. CSS does it where it can; elsewhere this measures, again when the width changes. */
function useGrow(field: RefObject<HTMLTextAreaElement | null>, text: string) {
  useLayoutEffect(() => {
    const element = field.current;
    if (!element || CSS.supports('field-sizing', 'content')) return;
    const fit = () => {
      element.style.height = 'auto';
      element.style.height = `${String(element.scrollHeight)}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element.parentElement ?? element);
    return () => {
      observer.disconnect();
    };
  }, [field, text]);
}

/**
 * Something already written, edited where it's read. Enter keeps a change (Cmd or Ctrl and Enter when `multiline`),
 * as does leaving, and Esc puts it back. Kept empty, it's gone.
 */
function InPlaceField({
  value,
  label,
  labelledBy,
  describedBy,
  placeholder,
  multiline,
  className,
  onDraft,
  onKeep,
}: {
  value: string;
  label?: string;
  labelledBy?: string;
  describedBy?: string | undefined;
  placeholder?: string;
  multiline: boolean;
  className: string;
  onDraft?: (text: string | null) => void;
  onKeep: (text: string, byKey: boolean) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setDraft(value);
  }
  const field = useRef<HTMLTextAreaElement>(null);
  useGrow(field, draft);

  const keep = (byKey: boolean) => {
    onDraft?.(null);
    // A pasted line break has no place in a one-line item.
    const text = (multiline ? draft : draft.replace(/\s*\n\s*/g, ' ')).trim();
    if (text === value.trim()) {
      setDraft(value);
      return;
    }
    onKeep(text, byKey);
  };

  return (
    <textarea
      ref={field}
      rows={1}
      value={draft}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      placeholder={placeholder}
      enterKeyHint={multiline ? 'enter' : 'done'}
      className={`${IN_PLACE} ${className}`}
      onChange={(event) => {
        setDraft(event.target.value);
        onDraft?.(event.target.value);
      }}
      onKeyDown={(event) => {
        if (multiline ? isModEnter(event) : event.key === 'Enter') {
          event.preventDefault();
          keep(true);
        }
        if (event.key === 'Escape' && draft !== value) {
          event.preventDefault();
          setDraft(value);
          onDraft?.(null);
        }
      }}
      onBlur={() => {
        keep(false);
      }}
    />
  );
}

function RemoveButton({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Button
      variant="quiet"
      shape="row"
      aria-label={label}
      onClick={onRemove}
      // Always there without hover, as on a phone.
      className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
    >
      <span className="flex h-[calc(1lh+0.25rem)] items-center">
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </span>
    </Button>
  );
}

function AddButton({
  buttonRef,
  onClick,
  children,
}: {
  buttonRef: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button ref={buttonRef} variant="quiet" onClick={onClick} className="-ms-2 flex items-center gap-1.5 self-start">
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M8 3.5v9M3.5 8h9" />
      </svg>
      {children}
    </Button>
  );
}

/** Says what a draft reads like, before it's added. Always in the page, so a screen reader hears it arrive. */
function RepeatNote({ id, children }: { id: string; children: string | null }) {
  return (
    <div id={id} role="status" className="empty:hidden">
      {children !== null && (
        <p className="mt-1.5 rounded-sm bg-sunken px-2 py-1.5 text-[13px] leading-snug text-pretty">{children}</p>
      )}
    </div>
  );
}

const repeatText = {
  pains: (match: string) => `Close to one you have: “${excerpt(match)}”. Sharpen that one instead?`,
  ideas: (match: string) => `Close to an idea you have: “${excerpt(match)}”.`,
};

function Disc() {
  return (
    <span aria-hidden="true" className="flex h-[calc(1lh+0.25rem)] w-4 shrink-0 items-center">
      <span className="size-[5px] rounded-full bg-muted" />
    </span>
  );
}

/** `adding` is the id a new item shows under until the server names it. */
type Save = (
  edit: ResearchEdit,
  apply: (draft: Draft) => Draft,
  options?: { refocus?: (() => void) | undefined; adding?: string },
) => void;

const newAddingId = () => `adding-${crypto.randomUUID()}`;

const renamed = (draft: Draft, from: string, to: string): Draft => {
  const swap = <T extends { id: string }>(items: T[]) =>
    items.map((item) => (item.id === from ? { ...item, id: to } : item));
  return { ...draft, pains: swap(draft.pains), hearing: swap(draft.hearing), ideas: swap(draft.ideas) };
};

/** Pain points or ideas: a bulleted list, each edited in place, with Add at the foot. */
function PointList({
  list,
  items,
  addLabel,
  itemLabel,
  noun,
  save,
}: {
  list: 'pains' | 'ideas';
  items: ResearchItemView[];
  addLabel: string;
  itemLabel: string;
  noun: string;
  save: Save;
}) {
  const [adding, setAdding] = useState(false);
  const [writing, setWriting] = useState<{ id: string | null; text: string } | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const refocus = () => {
    requestAnimationFrame(() => addButton.current?.focus());
  };
  const noteId = useId();
  const hintId = useId();
  const match = writing === null ? null : findRepeat(writing.text, items, writing.id ?? undefined);
  const note = match === null ? null : repeatText[list](match.text);
  const growing = growingLine(list, items.length);

  const remove = (item: ResearchItemView, byKey: boolean) => {
    save(
      { action: 'remove', list, id: item.id },
      (draft) => ({ ...draft, [list]: draft[list].filter((other) => other.id !== item.id) }),
      { refocus: byKey ? refocus : undefined },
    );
  };
  const add = (text: string) => {
    const trimmed = text.trim();
    const adding = newAddingId();
    save(
      { action: 'add', list, text: trimmed },
      (draft) => ({ ...draft, [list]: [...draft[list], { id: adding, text: trimmed }] }),
      { adding },
    );
  };

  return (
    <>
      {(items.length > 0 || adding) && (
        <ul className={`flex flex-col gap-1 ${POINTS}`}>
          {items.map((item) => (
            <li key={item.id} className="group">
              <div className="flex items-start gap-1">
                <Disc />
                <div className="min-w-0 flex-1">
                  <InPlaceField
                    value={item.text}
                    label={itemLabel}
                    describedBy={writing?.id === item.id ? noteId : undefined}
                    multiline={false}
                    className={POINTS}
                    onDraft={(text) => {
                      setWriting(text === null ? null : { id: item.id, text });
                    }}
                    onKeep={(text, byKey) => {
                      if (text === '') remove(item, byKey);
                      else
                        save({ action: 'edit', list, id: item.id, text }, (draft) => ({
                          ...draft,
                          [list]: draft[list].map((other) => (other.id === item.id ? { ...other, text } : other)),
                        }));
                    }}
                  />
                </div>
                <RemoveButton
                  label={`Remove this ${noun}`}
                  onRemove={() => {
                    remove(item, true);
                  }}
                />
              </div>
              {writing?.id === item.id && <RepeatNote id={noteId}>{note}</RepeatNote>}
            </li>
          ))}
          {adding && (
            <li>
              {/* Ends where the rows' × begins, so the new item lines up with the rest. */}
              <div className="flex items-start gap-1 pe-9 max-lg:pe-12">
                <Disc />
                <div className="min-w-0 flex-1">
                  <AddField
                    label={addLabel}
                    placeholder=""
                    keepGoing={list === 'ideas'}
                    describedBy={`${hintId} ${noteId}`}
                    className={`py-0.5 ${POINTS}`}
                    onDraft={(text) => {
                      setWriting({ id: null, text });
                    }}
                    onAdd={add}
                    onFinish={(byKey) => {
                      setWriting(null);
                      setAdding(false);
                      if (byKey) refocus();
                    }}
                  />
                  <p id={hintId} className={`mt-1 ${HINT}`}>
                    {list === 'ideas'
                      ? 'Enter adds it and starts another. Esc finishes.'
                      : 'Enter adds it. Esc gives up.'}
                  </p>
                  {writing?.id === null && <RepeatNote id={noteId}>{note}</RepeatNote>}
                </div>
              </div>
            </li>
          )}
        </ul>
      )}
      {growing !== null && <p className={HINT}>{growing}</p>}
      {!adding && (
        <AddButton
          buttonRef={addButton}
          onClick={() => {
            setAdding(true);
          }}
        >
          {addLabel}
        </AddButton>
      )}
    </>
  );
}

function quoteRepeat(text: string, quotes: QuoteView[], skipId?: string) {
  const match = findRepeat(text, quotes, skipId);
  return match === null
    ? null
    : `Sounds like what ${match.participant} said: “${excerpt(match.text)}”. Add it only if it says something new.`;
}

const FIELD_LABEL = 'text-[13px] leading-snug text-muted';
const LINE_INPUT =
  'h-8 w-full rounded-sm bg-canvas px-2 text-base shadow-[inset_0_0_0_1px_var(--line)] placeholder:text-muted max-lg:h-11 lg:text-[13px]';

/** A small raised form, in place: the words, who said them, and their persona. */
function QuoteForm({
  personas,
  quotes,
  onAdd,
  onCancel,
}: {
  personas: PersonaView[];
  quotes: QuoteView[];
  onAdd: (quote: { text: string; participant: string; personaId: string | null }) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState('');
  const [participant, setParticipant] = useState('');
  const [personaId, setPersonaId] = useState('');
  const words = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const ready = stripQuoteMarks(text) !== '' && participant.trim() !== '';
  const note = quoteRepeat(text, quotes);

  useLayoutEffect(() => {
    words.current?.focus({ preventScroll: true });
    words.current?.scrollIntoView({ block: 'nearest' });
  }, []);

  const submit = () => {
    if (!ready) return;
    onAdd({ text: stripQuoteMarks(text), participant: participant.trim(), personaId: personaId || null });
  };

  return (
    <form
      aria-label="Add what someone said"
      className="flex flex-col gap-3 rounded-md bg-surface p-3 shadow-raised"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      onKeyDown={(event) => {
        if (isModEnter(event)) {
          event.preventDefault();
          submit();
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          onCancel();
        }
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-words`} className={FIELD_LABEL}>
          What they said
        </label>
        <textarea
          ref={words}
          id={`${id}-words`}
          rows={3}
          value={text}
          aria-describedby={`${id}-note`}
          className={TEXT_BOX}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
        <RepeatNote id={`${id}-note`}>{note}</RepeatNote>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor={`${id}-persona`} className={FIELD_LABEL}>
            Persona
          </label>
          <div className="relative">
            <select
              id={`${id}-persona`}
              value={personaId}
              className={`${SELECT} w-full`}
              onChange={(event) => {
                setPersonaId(event.target.value);
              }}
            >
              <option value="">None</option>
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor={`${id}-participant`} className={FIELD_LABEL}>
            Participant
          </label>
          <input
            id={`${id}-participant`}
            value={participant}
            placeholder="P9, mechanic"
            autoComplete="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            data-bwignore
            data-form-type="other"
            className={LINE_INPUT}
            onChange={(event) => {
              setParticipant(event.target.value);
            }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="raised" aria-disabled={!ready}>
          Add
        </Button>
        <Button variant="quiet" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Every quote, its words edited in place, with who said them under it. */
function QuoteList({ quotes, personas, save }: { quotes: QuoteView[]; personas: PersonaView[]; save: Save }) {
  const [adding, setAdding] = useState(false);
  const [writing, setWriting] = useState<{ id: string; text: string } | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const refocus = () => {
    requestAnimationFrame(() => addButton.current?.focus());
  };
  const noteId = useId();
  const note = writing === null ? null : quoteRepeat(writing.text, quotes, writing.id);
  const growing = growingLine('hearing', quotes.length);

  const remove = (quote: QuoteView, byKey: boolean) => {
    save(
      { action: 'remove', list: 'hearing', id: quote.id },
      (draft) => ({ ...draft, hearing: draft.hearing.filter((other) => other.id !== quote.id) }),
      { refocus: byKey ? refocus : undefined },
    );
  };

  return (
    <>
      {quotes.length > 0 && (
        <ul className="flex flex-col gap-4">
          {quotes.map((quote) => {
            const persona = personas.find((other) => other.id === quote.personaId);
            return (
              <li key={quote.id} className="group">
                <figure className="flex items-start gap-1">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className={`relative ${QUOTE}`}>
                      {/* Hangs into the margin, so the words line up with the column. */}
                      <span aria-hidden="true" className="pointer-events-none absolute top-0.5 -left-[0.4em]">
                        “
                      </span>
                      <InPlaceField
                        value={quote.text}
                        label={`What ${quote.participant} said`}
                        describedBy={writing?.id === quote.id ? noteId : undefined}
                        multiline
                        className={QUOTE}
                        onDraft={(text) => {
                          setWriting(text === null ? null : { id: quote.id, text });
                        }}
                        onKeep={(text, byKey) => {
                          const words = stripQuoteMarks(text);
                          if (words === '') {
                            remove(quote, byKey);
                            return;
                          }
                          save(
                            {
                              action: 'edit',
                              list: 'hearing',
                              id: quote.id,
                              quote: {
                                text: words,
                                participant: quote.participant,
                                ...(quote.personaId === null ? {} : { personaId: quote.personaId as PersonaId }),
                              },
                            },
                            (draft) => ({
                              ...draft,
                              hearing: draft.hearing.map((other) =>
                                other.id === quote.id ? { ...other, text: words } : other,
                              ),
                            }),
                          );
                        }}
                      />
                    </div>
                    <figcaption className="flex items-center gap-1.5 text-[13px] leading-snug text-muted">
                      {persona && <PersonaGlyph icon={persona.icon} label={persona.name} />}
                      {quote.participant}
                    </figcaption>
                    {writing?.id === quote.id && <RepeatNote id={noteId}>{note}</RepeatNote>}
                  </div>
                  <RemoveButton
                    label={`Remove what ${quote.participant} said`}
                    onRemove={() => {
                      remove(quote, true);
                    }}
                  />
                </figure>
              </li>
            );
          })}
        </ul>
      )}
      {growing !== null && <p className={HINT}>{growing}</p>}
      {adding ? (
        <QuoteForm
          personas={personas}
          quotes={quotes}
          onAdd={(quote) => {
            setAdding(false);
            refocus();
            const adding = newAddingId();
            save(
              {
                action: 'add',
                list: 'hearing',
                quote: {
                  text: quote.text,
                  participant: quote.participant,
                  ...(quote.personaId === null ? {} : { personaId: quote.personaId as PersonaId }),
                },
              },
              (draft) => ({
                ...draft,
                hearing: [...draft.hearing, { id: adding, ...quote }],
              }),
              { adding },
            );
          }}
          onCancel={() => {
            setAdding(false);
            refocus();
          }}
        />
      ) : (
        <AddButton
          buttonRef={addButton}
          onClick={() => {
            setAdding(true);
          }}
        >
          Add what someone said
        </AddButton>
      )}
    </>
  );
}

const participantOf = (edit: ResearchEdit, draft: Draft) => {
  if (edit.action === 'add' && edit.list === 'hearing') return edit.quote.participant;
  if (edit.action === 'remove' && edit.list === 'hearing')
    return draft.hearing.find((quote) => quote.id === edit.id)?.participant ?? '';
  return '';
};

/**
 * The summary, pain points, what we're hearing and ideas, written where they're read. Changes show at once and save
 * in the background; one that can't be saved is put back. Adding and removing get Undo.
 */
export function ResearchEditor({
  model,
  edit,
  onChange,
  onProblem,
}: {
  model: TaskViewModel;
  edit: EditResearch;
  onChange: (change: { token: string; message: string }) => void;
  onProblem: (message: string) => void;
}) {
  const [draft, setDraft] = useState(() => fromModel(model));
  const [seen, setSeen] = useState(model);
  if (seen !== model) {
    setSeen(model);
    setDraft(fromModel(model));
  }
  const latest = useRef(model);
  latest.current = model;
  const kind = model.page.kind;

  const save: Save = (change, apply, options = {}) => {
    const list: ResearchList | null = change.action === 'set-summary' ? null : change.list;
    const message =
      list !== null && (change.action === 'add' || change.action === 'remove')
        ? researchMessage(change.action, list, participantOf(change, draft))
        : null;
    setDraft(apply);
    options.refocus?.();
    const failed = () => {
      setDraft(fromModel(latest.current));
      onProblem('Couldn’t save that. Try again.');
    };
    void edit({ mapId: model.mapId, itemId: model.page.id, edit: change }).then((result) => {
      if (!result.ok) {
        failed();
        return;
      }
      const { adding } = options;
      if (adding !== undefined && result.id !== null) {
        const named = result.id;
        setDraft((current) => renamed(current, adding, named));
      }
      if (message !== null && result.undoToken !== null) onChange({ token: result.undoToken, message });
    }, failed);
  };

  return (
    <>
      <Section id="tv-summary" title="Summary">
        <InPlaceField
          value={draft.summary}
          labelledBy="tv-summary"
          placeholder={`One to four sentences on what this ${kind} is and why it’s hard`}
          multiline
          className={POINTS}
          onKeep={(text) => {
            save({ action: 'set-summary', text }, (current) => ({ ...current, summary: text }));
          }}
        />
      </Section>
      <Section id="tv-pains" title="Pain points">
        <PointList
          list="pains"
          items={draft.pains}
          addLabel="Add a pain point"
          itemLabel="Pain point"
          noun="pain point"
          save={save}
        />
      </Section>
      <Section id="tv-hearing" title="What we’re hearing">
        <QuoteList quotes={draft.hearing} personas={model.allPersonas} save={save} />
      </Section>
      <Section id="tv-ideas" title={`How might we better support this ${kind}?`}>
        <PointList list="ideas" items={draft.ideas} addLabel="Add an idea" itemLabel="Idea" noun="idea" save={save} />
      </Section>
    </>
  );
}
