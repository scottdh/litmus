import type { ReactNode } from 'react';

/** Rename on a pick row: shown on hover or focus with a mouse, and always on a phone. Its row is `group/pick`. */
export const RENAME_BUTTON =
  'relative shrink-0 cursor-pointer rounded-sm px-1.5 text-[12px] text-muted opacity-0 transition-[opacity,color] duration-150 ease-out group-hover/pick:opacity-100 before:absolute before:inset-x-0 before:-inset-y-3 hover:text-ink focus-visible:opacity-100 max-lg:min-h-11 max-lg:opacity-100';

const taskCount = (count: number) => `${String(count)} ${count === 1 ? 'task' : 'tasks'}`;

/** A checkbox row in a popover that picks whose tasks to show, with its task count. */
export function PickRow({
  name,
  icon,
  count,
  pressed,
  muted = false,
  onToggle,
}: {
  name: string;
  icon?: ReactNode;
  count: number;
  pressed: boolean;
  /** For a row that isn't one of the list's own, like No team. */
  muted?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className="flex min-h-11 min-w-0 grow cursor-pointer items-center gap-2.5 rounded-sm px-1.5 text-start text-[14px] transition-colors duration-150 ease-out hover:bg-canvas"
    >
      <span
        aria-hidden="true"
        className={`grid size-4 shrink-0 place-items-center rounded-[3px] shadow-raised transition-colors duration-150 ease-out ${pressed ? 'bg-ink text-canvas' : 'bg-surface'}`}
      >
        {pressed && (
          <svg viewBox="0 0 12 12" className="size-3">
            <path
              d="M2.5 6.5 5 9l4.5-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {icon}
      <span className={muted ? 'grow text-muted' : 'grow'}>{name}</span>
      <span className="text-[12px] text-muted tabular-nums">{taskCount(count)}</span>
    </button>
  );
}
