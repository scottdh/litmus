'use client';
// PROTOTYPE (#104). Throwaway. Pieces the three directions share, so they differ only in how editing works.
import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import type { PersonaView } from '@litmus/core';
import { Button } from '../../../ui/button';
import { LINE_FIELD, TEXT_BOX } from '../../../ui/control';
import { PersonaGlyph } from '../../map/persona-icon';
import { PopoverClose, PopoverPanel, PopoverRoot, PopoverTitle, PopoverTrigger } from '../../../ui/popover';
import { button } from '../../../ui/control';
import { SelectChevron } from '../../map/select-chevron';
import { short, voices, type PPain, type PQuote, type Place } from './store';

export const BODY = 'text-[15px] leading-[1.6] text-pretty';
export const CAPTION = 'text-[13px] leading-snug text-muted';

export function Section({
  id,
  title,
  action,
  children,
}: {
  id: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={id} className="text-[15px] leading-snug font-semibold text-balance">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function QuoteRead({ quote, personas }: { quote: PQuote; personas: PersonaView[] }) {
  const persona = personas.find((other) => other.id === quote.personaId);
  return (
    <figure className="flex flex-col gap-1">
      <blockquote className="-indent-[0.4em] text-[14px] leading-[1.55] text-pretty">“{quote.text}”</blockquote>
      <figcaption className="flex items-center gap-1.5 text-[13px] leading-snug text-muted">
        {persona && <PersonaGlyph icon={persona.icon} label={persona.name} />}
        {quote.participant}
      </figcaption>
    </figure>
  );
}

function Cross() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="m4.5 4.5 7 7m0-7-7 7" strokeLinecap="round" />
    </svg>
  );
}

/** A quiet × that removes one thing. Named for what it removes. */
export function RemoveButton({ label, className = '', ...props }: ComponentProps<'button'> & { label: string }) {
  return (
    <Button
      variant="quiet"
      shape="icon"
      aria-label={label}
      title={label}
      className={`shrink-0 ${className}`}
      {...props}
    >
      <Cross />
    </Button>
  );
}

const grow = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${String(el.scrollHeight)}px`;
};

/**
 * Text that is its own field: it reads as text, and editing is a click away. Leaving or Enter keeps the change, and
 * Esc puts it back. Clearing it and leaving removes the thing, when `onEmpty` is given.
 */
export function InPlaceText({
  value,
  label,
  className,
  multiline = false,
  placeholder,
  onCommit,
  onEmpty,
  onDraft,
  autoFocus = false,
}: {
  value: string;
  label: string;
  className: string;
  multiline?: boolean;
  placeholder?: string;
  onCommit: (text: string) => void;
  onEmpty?: () => void;
  onDraft?: (text: string) => void;
  autoFocus?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    setDraft(value);
  }, [value]);
  useLayoutEffect(() => {
    grow(ref.current);
  }, [draft]);
  useLayoutEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  const commit = () => {
    const text = draft.trim();
    if (text === '' && onEmpty) onEmpty();
    else if (text !== value) onCommit(text);
    else setDraft(value);
  };
  return (
    <textarea
      ref={ref}
      rows={1}
      value={draft}
      aria-label={label}
      placeholder={placeholder}
      className={`-mx-1.5 block w-[calc(100%+0.75rem)] resize-none overflow-hidden rounded-sm bg-transparent px-1.5 transition-[background-color,box-shadow] duration-150 ease-out outline-none placeholder:text-muted hover:bg-sunken focus:bg-canvas focus:shadow-[inset_0_0_0_1px_var(--ink)] max-lg:text-base ${className}`}
      onChange={(e) => {
        setDraft(e.target.value);
        onDraft?.(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setDraft(value);
          onDraft?.(value);
          requestAnimationFrame(() => ref.current?.blur());
        }
        if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          ref.current?.blur();
        }
      }}
      onBlur={commit}
    />
  );
}

/** A line field for something new, written where it'll appear. */
export function NewLine({
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  onCancel,
  className = '',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  useLayoutEffect(() => {
    grow(ref.current);
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      aria-label={label}
      placeholder={placeholder}
      enterKeyHint="done"
      className={`${LINE_FIELD} text-base lg:text-[15px] lg:leading-[1.6] ${className}`}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          onSubmit();
        }
      }}
    />
  );
}

export interface QuoteDraft {
  text: string;
  personaId: string | null;
  participant: string;
}
export const EMPTY_QUOTE: QuoteDraft = { text: '', personaId: null, participant: '' };

/** What someone said, who they are, and the label that keeps them anonymous. */
export function QuoteFields({
  draft,
  onDraft,
  personas,
  autoFocus = true,
  boxed = false,
}: {
  draft: QuoteDraft;
  onDraft: (draft: QuoteDraft) => void;
  personas: PersonaView[];
  autoFocus?: boolean;
  boxed?: boolean;
}) {
  const id = useId();
  const words = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    if (autoFocus) words.current?.focus({ preventScroll: true });
  }, [autoFocus]);
  useLayoutEffect(() => {
    if (!boxed) grow(words.current);
  }, [draft.text, boxed]);
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className={CAPTION}>What they said</span>
        <textarea
          ref={words}
          rows={boxed ? 3 : 1}
          value={draft.text}
          className={boxed ? TEXT_BOX : `${LINE_FIELD} text-base lg:text-[14px] lg:leading-[1.55]`}
          onChange={(e) => {
            onDraft({ ...draft, text: e.target.value });
          }}
        />
      </label>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <label className="flex flex-col gap-1">
          <span className={CAPTION}>Persona</span>
          <span className="relative">
            <select
              id={`${id}-persona`}
              value={draft.personaId ?? ''}
              className="h-8 w-full cursor-pointer appearance-none rounded-sm bg-canvas ps-2 pe-7 text-base shadow-[inset_0_0_0_1px_var(--line)] max-lg:h-11 lg:text-[13px]"
              onChange={(e) => {
                onDraft({ ...draft, personaId: e.target.value === '' ? null : e.target.value });
              }}
            >
              <option value="">None</option>
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <SelectChevron />
          </span>
        </label>
        <label className="flex flex-col gap-1">
          <span className={CAPTION}>Participant</span>
          <input
            value={draft.participant}
            placeholder="P9, mechanic"
            autoComplete="off"
            spellCheck={false}
            data-1p-ignore
            className="h-8 w-full rounded-sm bg-canvas px-2 text-base shadow-[inset_0_0_0_1px_var(--line)] placeholder:text-muted max-lg:h-11 lg:text-[13px]"
            onChange={(e) => {
              onDraft({ ...draft, participant: e.target.value });
            }}
          />
        </label>
      </div>
    </div>
  );
}

export const quoteReady = (d: QuoteDraft) => d.text.trim() !== '' && d.participant.trim() !== '';
export const quoteFrom = (d: QuoteDraft) => ({
  text: d.text.trim().replace(/^[“"]|[”"]$/g, ''),
  personaId: d.personaId,
  participant: d.participant.trim(),
});

/** A form row: the main action, then Cancel. Cmd or Ctrl and Enter submits from anywhere inside. */
export function FormActions({ submit, ready, onCancel }: { submit: string; ready: boolean; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button type="submit" variant="raised" aria-disabled={!ready}>
        {submit}
      </Button>
      <Button variant="quiet" data-cancel="" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

export const submitOnCmdEnter = (e: React.KeyboardEvent<HTMLFormElement>) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    e.currentTarget.requestSubmit();
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    e.currentTarget.querySelector<HTMLButtonElement>('button[data-cancel]')?.click();
  }
};

export function Plus() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M8 3.5v9M3.5 8h9" strokeLinecap="round" />
    </svg>
  );
}

const PICK_ROW =
  'flex w-full cursor-pointer items-start gap-2 rounded-sm px-1.5 py-1.5 text-left text-[14px] leading-snug text-pretty transition-colors duration-150 ease-out hover:bg-canvas aria-disabled:cursor-default aria-disabled:text-muted aria-disabled:hover:bg-transparent max-lg:min-h-11';

/** Where a quote can go: the pain points that sound like it first, then the rest, then not yet placed. */
export function MoveMenu({
  label,
  trigger,
  at,
  pains,
  suggested,
  onMove,
  triggerClassName = '',
}: {
  label: string;
  trigger: ReactNode;
  at: Place;
  pains: PPain[];
  suggested: PPain[];
  onMove: (to: Place) => void;
  triggerClassName?: string;
}) {
  const rest = pains.filter((p) => !suggested.includes(p));
  const row = (pain: PPain) => (
    <PopoverClose
      key={pain.id}
      aria-disabled={pain.id === at}
      className={PICK_ROW}
      onClick={() => {
        if (pain.id !== at) onMove(pain.id);
      }}
    >
      <span className="flex-1">{short(pain.text, 90)}</span>
      <span className="shrink-0 text-[12px] text-muted tabular-nums">
        {pain.id === at ? 'Here' : voices(pain.quotes.length)}
      </span>
    </PopoverClose>
  );
  return (
    <PopoverRoot>
      <PopoverTrigger aria-label={label} className={`${button({ variant: 'quiet' })} ${triggerClassName}`}>
        {trigger}
      </PopoverTrigger>
      <PopoverPanel align="start" className="w-[min(22rem,calc(100vw-2rem))] p-2">
        <PopoverTitle className="px-1.5 pt-1 pb-1.5 text-[13px] font-semibold">Place under</PopoverTitle>
        {suggested.length > 0 && (
          <>
            <p className="px-1.5 pb-1 text-[12px] text-muted">Sounds like</p>
            {suggested.map(row)}
            {rest.length > 0 && <div className="mx-1.5 my-1.5 border-t-(length:--hairline) border-line" />}
          </>
        )}
        {rest.map(row)}
        <div className="mx-1.5 my-1.5 border-t-(length:--hairline) border-line" />
        <PopoverClose
          aria-disabled={at === null}
          className={PICK_ROW}
          onClick={() => {
            if (at !== null) onMove(null);
          }}
        >
          <span className="flex-1 text-muted">Not yet placed</span>
        </PopoverClose>
      </PopoverPanel>
    </PopoverRoot>
  );
}
