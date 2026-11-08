/** The quiet button: 32 px with its tap area stretched to 44 px, and a full 44 px on a phone. */
export const BUTTON =
  'relative h-8 cursor-pointer rounded-sm px-2 text-[13px] font-medium transition-[background-color,color,scale] duration-150 ease-out before:absolute before:inset-x-0 before:-inset-y-1.5 active:scale-[0.96] max-lg:h-11 max-lg:before:inset-y-0';

/** The 32 px square for a button that's only an icon. On a phone it's 44 px tall and shares out the row's width, so a tap lands on one. */
export const ICON_BUTTON =
  'relative grid h-8 cursor-pointer place-items-center rounded-sm transition-[background-color,color,scale] duration-150 ease-out before:absolute before:-inset-x-0.5 before:-inset-y-1.5 active:scale-[0.96] max-lg:h-11 max-lg:flex-1 max-lg:before:inset-y-0 lg:w-8';

/** A raised control: a `surface` fill with the raised ring, so it reads the same on the canvas, in the drawer and in a popover. It dips to `canvas` on hover, like a pick row. */
export const RAISED = 'bg-surface shadow-raised hover:bg-canvas';
