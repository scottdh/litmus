import Link from 'next/link';
import type { PersonaView, QuoteView } from '@litmus/core';
import type { ReactNode } from 'react';
import { LightMark } from '../map/light-mark';
import { LIGHT_COPY, MARK_COLOUR, describeMix } from '../map/lights';
import { MixBar } from '../map/mix-bar';
import { PersonaGlyph } from '../map/persona-icon';
import { StepMark } from '../map/step-mark';
import { TeamMark } from '../map/team-line';
import { formatDay, type TaskViewModel } from './model';

export const taskViewHref = (id: string) => `/task/${id}`;

const BODY = 'text-[15px] leading-[1.6] text-pretty';
const QUIET = 'text-[14px] leading-snug text-pretty text-muted';
const ROW_LINK = 'transition-colors duration-150 ease-out hover:bg-sunken';

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-[15px] leading-snug font-semibold text-balance">
        {title}
      </h2>
      {children}
    </section>
  );
}

function RowMark({ light }: { light: TaskViewModel['children'][number]['light'] }) {
  return (
    <span className="flex h-[1lh] shrink-0 items-center">
      {light === null ? (
        <StepMark className="" />
      ) : (
        <span className={MARK_COLOUR[light]}>
          <LightMark light={light} className="size-3" />
          <span className="sr-only">{LIGHT_COPY[light].label}: </span>
        </span>
      )}
    </span>
  );
}

export function Heading({ model }: { model: TaskViewModel }) {
  const { page, personas, team } = model;
  return (
    <div className="flex flex-col gap-3">
      {/* What it sits under. The story column says this on a wide screen, and the fold row names the chapter. */}
      {page.path.length > 0 && (
        <p className="text-[13px] leading-snug text-pretty text-muted lg:hidden">
          {page.path.map((place) => place.name).join(' · ')}
        </p>
      )}
      <h1 className="font-story text-[34px] leading-[1.1] tracking-[-0.015em] text-balance">{page.name}</h1>
      {/* The map and drawer leave these unlabelled to save room. This page has the room, so it's where the glyphs
          are learned. */}
      {(personas.length > 0 || team !== null) && (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[13px] leading-snug">
          {personas.length > 0 && (
            <>
              <dt className="text-muted">Who</dt>
              <dd className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {personas.map((persona) => (
                  <span key={persona.id} className="flex items-center gap-1.5">
                    <PersonaGlyph icon={persona.icon} />
                    {persona.name}
                  </span>
                ))}
              </dd>
            </>
          )}
          {team !== null && (
            <>
              <dt className="text-muted">Team</dt>
              <dd>
                <TeamMark />
                {team}
              </dd>
            </>
          )}
        </dl>
      )}
    </div>
  );
}

/** Steps take no light, so they show nothing. The Key explains the lights, not this page. */
export function LightNow({ model }: { model: TaskViewModel }) {
  const { light } = model.page;
  if (light === null) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 text-[15px] leading-snug">
        <span className={MARK_COLOUR[light]}>
          <LightMark light={light} />
        </span>
        {LIGHT_COPY[light].label}
      </p>
      {model.mix.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <MixBar mix={model.mix} className="h-1.5 w-full max-w-60 rounded-full" />
          <p className="text-[13px] leading-snug text-muted">
            Set by its subtasks: <span className="tabular-nums">{describeMix(model.mix)}</span>.
          </p>
        </div>
      ) : (
        model.review !== null && model.review !== '' && <p className={`${BODY} whitespace-pre-wrap`}>{model.review}</p>
      )}
    </div>
  );
}

function Quote({ quote, personas }: { quote: QuoteView; personas: PersonaView[] }) {
  const persona = personas.find((other) => other.id === quote.personaId);
  return (
    <figure className="flex flex-col gap-1">
      {/* Hangs the opening quote mark, so the words line up. */}
      <blockquote className="-indent-[0.4em] text-[14px] leading-[1.55] text-pretty">“{quote.text}”</blockquote>
      <figcaption className="flex items-center gap-1.5 text-[13px] leading-snug text-muted">
        {persona && <PersonaGlyph icon={persona.icon} label={persona.name} />}
        {quote.participant}
      </figcaption>
    </figure>
  );
}

function Quotes({ quotes, personas }: { quotes: QuoteView[]; personas: PersonaView[] }) {
  return (
    <ul className="flex flex-col gap-3 border-s-2 border-line ps-4">
      {quotes.map((quote) => (
        <li key={quote.text}>
          <Quote quote={quote} personas={personas} />
        </li>
      ))}
    </ul>
  );
}

/** The summary, pain points with the quotes that show them, and ideas. Nothing rolls up from below. */
export function Research({ model }: { model: TaskViewModel }) {
  const { summary, pains, loose, ideas, allPersonas } = model;
  const kind = model.page.kind;
  if (summary === null && pains.length === 0 && loose.length === 0 && ideas.length === 0)
    return <p className={QUIET}>No research on this {kind} yet.</p>;
  return (
    <>
      {summary !== null && (
        <Section id="tv-summary" title="Summary">
          <p className={BODY}>{summary}</p>
        </Section>
      )}
      {(pains.length > 0 || loose.length > 0) && (
        <Section id="tv-pains" title="Pain points">
          {pains.length > 0 && (
            <ul className="flex flex-col">
              {pains.map((pain) => (
                <li
                  key={pain.text}
                  className="flex flex-col gap-3 border-t-(length:--hairline) border-line py-4 first:border-t-0 first:pt-1"
                >
                  <p className={BODY}>{pain.text}</p>
                  {pain.quotes.length > 0 && <Quotes quotes={pain.quotes} personas={allPersonas} />}
                </li>
              ))}
            </ul>
          )}
          {loose.length > 0 && (
            <div
              className={`flex flex-col gap-3 ${pains.length > 0 ? 'border-t-(length:--hairline) border-line pt-4' : 'pt-1'}`}
            >
              <p className="text-[13px] leading-snug text-muted">Heard, but not yet placed under a pain point</p>
              <Quotes quotes={loose} personas={allPersonas} />
            </div>
          )}
        </Section>
      )}
      {ideas.length > 0 && (
        <Section id="tv-ideas" title={`How might we better support this ${kind}?`}>
          <ul className={`flex list-disc flex-col gap-2 ps-4 marker:text-muted ${BODY}`}>
            {ideas.map((idea) => (
              <li key={idea} className="ps-0.5">
                {idea}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

const INLINE_LINK =
  'text-ink underline decoration-line underline-offset-3 transition-colors duration-150 ease-out hover:decoration-ink';

/** Every change to the light, newest first. No author until there are accounts. */
export function History({ model }: { model: TaskViewModel }) {
  if (model.history.length === 0) return null;
  return (
    <Section id="tv-history" title="History">
      <ol className="flex flex-col">
        {model.history.map((line) => (
          <li
            key={line.key}
            className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3 border-t-(length:--hairline) border-line py-3 first:border-t-0 first:pt-0"
          >
            {line.ratedAt === null ? (
              <span />
            ) : (
              <time dateTime={line.ratedAt} className="text-[13px] leading-[1.5] text-muted tabular-nums">
                {formatDay(line.ratedAt)}
              </time>
            )}
            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-2 text-[14px] leading-[1.5]">
                <span className={MARK_COLOUR[line.light]}>
                  <LightMark light={line.light} className="size-3" />
                </span>
                {line.move}
              </p>
              {line.cause !== null && (
                <p className="text-[13px] leading-snug text-pretty text-muted">
                  Set by its subtask{' '}
                  <Link href={taskViewHref(line.cause.id)} className={INLINE_LINK}>
                    {line.cause.name}
                  </Link>
                </p>
              )}
              {line.note !== null && line.note !== '' && (
                <p className="text-[14px] leading-[1.55] text-pretty whitespace-pre-wrap">{line.note}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/** Its subtasks or steps. Shown on a phone, where the story column folds away. */
export function Children({ model }: { model: TaskViewModel }) {
  if (model.children.length === 0) return null;
  const title = model.page.kind === 'task' ? 'Subtasks' : 'Steps';
  const List = model.page.kind === 'task' ? 'ul' : 'ol';
  return (
    <Section id="tv-children" title={title}>
      <List aria-label={title}>
        {model.children.map((child) => (
          <li key={child.id}>
            <Link
              href={taskViewHref(child.id)}
              className={`-mx-1.5 flex min-h-11 items-start gap-2 rounded-sm px-1.5 py-2 text-[14px] leading-snug text-pretty ${ROW_LINK}`}
            >
              <RowMark light={child.light} />
              {child.name}
            </Link>
          </li>
        ))}
      </List>
    </Section>
  );
}

/** The tasks either side in story order, at the foot. */
export function Neighbours({ model }: { model: TaskViewModel }) {
  const { before, after, kind } = model.page;
  if (before === null && after === null) return null;
  const cell = (to: NonNullable<typeof before>, direction: 'Before' | 'After') => (
    <Link
      href={taskViewHref(to.id)}
      className={`flex flex-col gap-1 rounded-sm p-2 ${ROW_LINK} ${direction === 'After' ? 'col-start-2 -me-2 items-end text-right' : '-ms-2'}`}
    >
      <span className="text-[13px] text-muted">{direction}</span>
      <span className="text-[14px] leading-snug text-pretty">{to.name}</span>
    </Link>
  );
  return (
    <nav
      aria-label={`Before and after this ${kind}`}
      className="grid grid-cols-2 gap-4 border-t-(length:--hairline) border-line pt-4"
    >
      {before !== null && cell(before, 'Before')}
      {after !== null && cell(after, 'After')}
    </nav>
  );
}
