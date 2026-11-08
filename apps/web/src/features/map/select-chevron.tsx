/** The down arrow that says a control opens a list. 12 px, `currentColor`. */
export function Chevron({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className={className}>
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

/** The dropdown's own arrow, 8 px in from the end, in place of the browser's. */
export function SelectChevron() {
  return <Chevron className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-muted" />;
}
