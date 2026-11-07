'use client';
import { Popover } from '@base-ui/react/popover';
import type { ComponentProps } from 'react';

export const PopoverRoot = Popover.Root;
export const PopoverTrigger = Popover.Trigger;
export const PopoverTitle = Popover.Title;

/** Opens under its trigger, kept 16 px inside the window, and fades rather than moves. */
export function PopoverPanel({
  align = 'center',
  className = '',
  ...props
}: ComponentProps<typeof Popover.Popup> & { align?: 'start' | 'center' | 'end' }) {
  return (
    <Popover.Portal>
      <Popover.Positioner sideOffset={8} align={align} collisionPadding={16} className="z-30">
        <Popover.Popup
          className={`rounded-md bg-surface text-ink shadow-raised transition-opacity duration-150 ease-out-strong outline-none data-ending-style:duration-0 data-starting-style:opacity-0 ${String(className)}`}
          {...props}
        />
      </Popover.Positioner>
    </Popover.Portal>
  );
}
