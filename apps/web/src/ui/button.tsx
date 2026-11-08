import type { ComponentProps } from 'react';
import { button, type Shape, type Variant } from './control';

/**
 * A `<button>` with one of the shared variants. It defaults to `type="button"` and passes every other prop and the ref through.
 * `className` is for layout, or a text colour like `text-danger`; the variant owns the surface and hover.
 * For a Base UI trigger, put `button()` on its `className` instead.
 */
export function Button({
  variant,
  shape = 'text',
  type = 'button',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant: Variant; shape?: Shape }) {
  return <button type={type} className={`${button({ variant, shape })} ${className}`} {...props} />;
}
