/** The quiet 32 px button, with its tap area stretched to 44 px. */
export const BUTTON =
  'relative h-8 cursor-pointer rounded-sm px-2 text-[13px] font-medium transition-transform duration-150 ease-out before:absolute before:inset-x-0 before:-inset-y-1.5 active:scale-[0.96]';

/** The 32 px square for a button that's only an icon. On a phone it shares out the row's width, so a tap lands on one. */
export const ICON_BUTTON =
  'relative grid h-8 cursor-pointer place-items-center rounded-sm transition-transform duration-150 ease-out before:absolute before:-inset-x-0.5 before:-inset-y-1.5 active:scale-[0.96] max-lg:flex-1 lg:w-8';
