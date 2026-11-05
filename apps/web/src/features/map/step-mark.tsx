/** A step takes no light, so it gets a dash rather than anything that could read as one. */
export function StepMark() {
  return <span aria-hidden="true" className="mt-[0.65em] h-px w-2 shrink-0 bg-mark-grey" />;
}
