import { Chevron } from './select-chevron';

/**
 * A quiet line under the name that opens a list: the persona byline and the team line. It reads as a fact rather than
 * a field, so it has no surface until hovered.
 */
export const LINE_TRIGGER =
  'group/line -mx-1.5 min-w-0 self-stretch cursor-pointer rounded-sm px-1.5 py-1 text-start text-[13px] leading-relaxed text-pretty text-muted transition-colors duration-150 ease-out hover:bg-canvas max-lg:min-h-11';

/**
 * Ends a filled line with a chevron to say it opens a list, because a phone has no hover to show it. It's glued to the
 * last word so it never wraps alone, and goes `ink` with the line's hover.
 */
export function Opens() {
  return (
    <Chevron className="ms-1 inline size-3 -translate-y-px text-muted transition-colors duration-150 ease-out group-hover/line:text-ink" />
  );
}

/** Text that ends the line, with `Opens` glued to its last word. */
export function EndsWithOpens({ text }: { text: string }) {
  const at = text.lastIndexOf(' ') + 1;
  return (
    <>
      {text.slice(0, at)}
      <span className="whitespace-nowrap">
        {text.slice(at)}
        <Opens />
      </span>
    </>
  );
}
