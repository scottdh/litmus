import { describe, expect, it } from 'vitest';
import { button, VARIANTS } from './control';

describe('button', () => {
  it.each(VARIANTS.filter((variant) => variant !== 'fill'))('gives the %s variant a hover', (variant) => {
    expect(button({ variant })).toMatch(/\bhover:/);
    expect(button({ variant, shape: 'icon' })).toMatch(/\bhover:/);
  });

  it('leaves a fill alone on hover, because a darker light reads as a different light', () => {
    expect(button({ variant: 'fill' })).not.toMatch(/\bhover:bg-/);
  });

  it("keeps a disabled raised button still, so it doesn't look pressable", () => {
    expect(button({ variant: 'raised' })).toMatch(/\baria-disabled:hover:bg-surface\b/);
    expect(button({ variant: 'raised' })).toMatch(/\baria-disabled:active:scale-100\b/);
  });

  it('fades a fill in as fast as it fades out', () => {
    expect(button({ variant: 'fill' })).toMatch(/\btransition-\[background-color,color,scale\]/);
  });

  it('names every property it transitions', () => {
    for (const variant of VARIANTS) expect(button({ variant })).toMatch(/\btransition-\[[^\]]*scale[^\]]*\]/);
  });
});
