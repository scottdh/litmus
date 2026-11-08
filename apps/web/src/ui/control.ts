export const VARIANTS = ['raised', 'quiet', 'fill', 'on-ink'] as const;
export type Variant = (typeof VARIANTS)[number];

/** The raised surface on its own, for controls that aren't a `button()`: a select, or a radio drawn as a tile. Dips to `canvas` on hover. */
export const RAISED = 'bg-surface shadow-raised hover:bg-canvas';

const VARIANT: Record<Variant, string> = {
  /** The default for a button with a job: Save, Add step, Key, the move arrows, a light not yet picked. With `aria-disabled` it goes `muted` and stops reacting. */
  raised: `${RAISED} transition-[background-color,color,scale] aria-disabled:cursor-not-allowed aria-disabled:text-muted aria-disabled:hover:bg-surface aria-disabled:active:scale-100`,
  /** Secondary text with no surface: Cancel, Add task under a chapter. */
  quiet: 'text-muted transition-[color,scale] hover:text-ink',
  /** The caller sets the fill and its text (a light, `ink` or `danger`). It doesn't shift on hover, because a darker light reads as a different light. */
  fill: 'transition-[background-color,color,scale]',
  /** Text on an `ink` surface, like the toast. */
  'on-ink':
    'font-semibold text-surface underline decoration-surface/40 underline-offset-2 transition-[text-decoration-color,scale] hover:decoration-surface',
};

export type Shape = keyof typeof SHAPE;
const SHAPE = {
  /** 32 px tall with its tap area stretched to 44 px, and a full 44 px on a phone. */
  text: 'h-8 px-2 text-[13px] font-medium before:absolute before:inset-x-0 before:-inset-y-1.5 max-lg:h-11 max-lg:before:inset-y-0',
  /** A 32 px square. On a phone it's 44 px tall and shares out the row's width, so a tap lands on one. */
  icon: 'grid h-8 place-items-center before:absolute before:-inset-x-0.5 before:-inset-y-1.5 max-lg:h-11 max-lg:flex-1 max-lg:before:inset-y-0 lg:w-8',
};

/**
 * Every button's classes. `variant` is required so no button ships without a hover.
 * Use `<Button>` from `button.tsx` for a plain button; this is for a Base UI trigger's `className`.
 */
export const button = ({ variant, shape = 'text' }: { variant: Variant; shape?: Shape }) =>
  `relative cursor-pointer rounded-sm duration-150 ease-out active:scale-[0.96] ${SHAPE[shape]} ${VARIANT[variant]}`;

/** A raised dropdown. It hides the browser's arrow, so wrap it in a `relative` box with `SelectChevron` after it. */
export const SELECT = `${RAISED} h-8 cursor-pointer appearance-none rounded-sm ps-2 pe-7 text-base font-medium transition-colors duration-150 ease-out max-lg:h-11 lg:text-[13px]`;

/** A boxed multi-line field, for a note or a review. 16 px on a phone so iOS doesn't zoom. */
export const TEXT_BOX =
  'block min-h-[4.5em] w-full resize-y rounded-sm bg-canvas p-2 text-base leading-snug shadow-[inset_0_0_0_1px_var(--line)] [field-sizing:content] placeholder:text-muted aria-invalid:outline-2 aria-invalid:outline-offset-2 aria-invalid:outline-mark-red lg:text-[14px]';

/** A field written straight onto the page, ruled underneath: a name, or a new item where it'll appear. */
export const LINE_FIELD =
  'block w-full resize-none overflow-hidden rounded-[2px] bg-transparent shadow-[0_1px_0_0_var(--line)] placeholder:text-muted aria-invalid:outline-2 aria-invalid:outline-offset-2 aria-invalid:outline-mark-red';
