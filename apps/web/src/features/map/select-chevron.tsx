import { RAISED } from './button-style';

/** A raised dropdown. It hides the browser's arrow, so wrap it in a `relative` box with `SelectChevron` after it. */
export const SELECT = `${RAISED} h-8 cursor-pointer appearance-none rounded-sm ps-2 pe-7 text-base font-medium transition-colors duration-150 ease-out max-lg:h-11 lg:text-[13px]`;

/** The dropdown's own arrow, 8 px in from the end, in place of the browser's. */
export function SelectChevron() {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-muted"
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
