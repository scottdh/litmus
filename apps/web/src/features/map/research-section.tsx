'use client';
import type { PersonaView, QuoteView, ResearchView } from '@litmus/core';
import type { ReactNode } from 'react';
import { DisclosurePanel, DisclosureRoot, DisclosureTrigger } from '../../ui/disclosure';
import { PersonaGlyph } from './persona-icon';
import { researchSections } from './research';

const BODY = 'text-[14px] leading-[1.55] text-pretty';

function Quotes({ quotes, personas }: { quotes: QuoteView[]; personas: PersonaView[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {quotes.map((quote) => {
        const persona = personas.find((other) => other.id === quote.personaId);
        return (
          <li key={quote.text}>
            <figure className="flex flex-col gap-1">
              {/* Hangs the opening quote mark, so the words line up with everything else. */}
              <blockquote className={`${BODY} -indent-[0.4em]`}>“{quote.text}”</blockquote>
              <figcaption className="flex items-center gap-1.5 text-[13px] leading-snug text-muted">
                {persona && <PersonaGlyph icon={persona.icon} label={persona.name} />}
                {quote.participant}
              </figcaption>
            </figure>
          </li>
        );
      })}
    </ul>
  );
}

function Points({ items }: { items: string[] }) {
  return (
    <ul className={`flex list-disc flex-col gap-1.5 ps-4 marker:text-muted ${BODY}`}>
      {items.map((item) => (
        <li key={item} className="ps-0.5">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0 text-muted transition-transform duration-150 ease-out group-data-panel-open:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

/** A titled row with its count that opens in place. Full bleed, so its hover fills the band between hairlines. */
function Fold({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <DisclosureRoot className="-mx-6 w-[calc(100%+3rem)] border-t-(length:--hairline) border-line last:border-b-(length:--hairline)">
      <DisclosureTrigger className="group flex min-h-11 w-full cursor-pointer items-center gap-2 px-6 py-2.5 text-left text-[14px] leading-snug transition-colors duration-150 ease-out hover:bg-canvas focus-visible:-outline-offset-2">
        <span className="flex-1 text-pretty">{title}</span>
        <span className="text-[13px] text-muted tabular-nums">{count}</span>
        <Chevron />
      </DisclosureTrigger>
      {/* Padding sits inside, because a closed panel stays in the layout for find-in-page. */}
      <DisclosurePanel>
        <div className="px-6 pt-1 pb-5">{children}</div>
      </DisclosurePanel>
    </DisclosureRoot>
  );
}

/**
 * What research says about a task, subtask or step, read-only. The summary stays open; quotes, pain points, ideas
 * and what's under it fold behind rows with counts, so the drawer stays short.
 */
export function ResearchSection({
  research,
  kind,
  personas,
  under,
}: {
  research: ResearchView | null;
  kind: 'task' | 'subtask' | 'step';
  personas: PersonaView[];
  /** Subtasks or steps, and Add. None for a step. */
  under: { label: string; count: number; content: ReactNode } | null;
}) {
  const { summary, folds, empty } = researchSections(research, kind);
  return (
    <>
      {empty && <p className="text-[13px] leading-snug text-pretty text-muted">No research on this {kind} yet.</p>}
      {summary !== null && (
        <section aria-labelledby="drawer-summary" className="flex flex-col gap-2">
          <h3 id="drawer-summary" className="text-[13px] leading-snug text-muted">
            Summary
          </h3>
          <p className={BODY}>{summary}</p>
        </section>
      )}
      {(folds.length > 0 || under !== null) && (
        <div className="flex w-full flex-col">
          {folds.map((fold) => (
            <Fold key={fold.key} title={fold.title} count={fold.count}>
              {fold.key === 'hearing' ? (
                <Quotes quotes={fold.quotes} personas={personas} />
              ) : (
                <Points items={fold.items} />
              )}
            </Fold>
          ))}
          {under !== null && (
            <Fold title={under.label} count={under.count}>
              <div className="flex w-full flex-col items-start gap-2">{under.content}</div>
            </Fold>
          )}
        </div>
      )}
    </>
  );
}
