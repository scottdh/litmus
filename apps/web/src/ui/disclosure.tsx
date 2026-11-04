'use client';
import { Collapsible } from '@base-ui/react/collapsible';
import type { ComponentProps } from 'react';

export const DisclosureRoot = Collapsible.Root;
export const DisclosureTrigger = Collapsible.Trigger;

export function DisclosurePanel({ className = '', ...props }: ComponentProps<typeof Collapsible.Panel>) {
  return (
    <Collapsible.Panel
      hiddenUntilFound
      className={`transition-opacity duration-150 ease-out-strong data-ending-style:duration-0 data-starting-style:opacity-0 ${String(className)}`}
      {...props}
    />
  );
}
