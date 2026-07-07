import { describe, it, expect } from 'vitest';
import { designFingerprint } from '@/lib/theme';
import { siteSeed, getDesignVariant } from '@/lib/designVariants';

// These literals are the CANONICAL fingerprints. The closet-dashboard mirror
// (src/lib/catalog/designFingerprint.ts) pins the exact same strings, so if the
// renderer's structural axes or voice/accent pool sizes ever change, both this
// test and the dashboard test break together — surfacing the drift immediately.
const CASES: Array<[string, string, string]> = [
  ['luxury-minimal', 'Summit Closets', '2.0.4.2.3.h0.b1.a1'],
  ['modern-office', 'acme|office|closets', '4.1.2.1.2.h1.b1.a0'],
  ['sophisticated-wine', 'Vintage Cellars|napa', '5.0.2.2.2.h2.b1.a0'],
  ['creative-craft', 'Maker Studio', '11.0.3.2.1.h0.b0.a1'],
  ['brutalist', 'Bold Co#2', '7.0.4.0.3.h1.b0.a2'],
];

describe('designFingerprint (canonical)', () => {
  it.each(CASES)('%s / %s is stable', (theme, seed, expected) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(designFingerprint(theme as any, seed)).toBe(expected);
  });

  it('is deterministic across calls', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = designFingerprint('luxury-minimal' as any, 'x');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = designFingerprint('luxury-minimal' as any, 'x');
    expect(a).toBe(b);
  });

  it('siteSeed precedence: designVariant > widgetId > brandName', () => {
    expect(siteSeed({ designVariant: 'a', widgetId: 'b', brandName: 'c' })).toBe('a');
    expect(siteSeed({ widgetId: 'b', brandName: 'c' })).toBe('b');
    expect(siteSeed({ brandName: 'c' })).toBe('c');
    expect(siteSeed({})).toBe('');
  });
});

describe('answer-optimized hero weighting', () => {
  // Sample many seeds for a luxe theme and confirm the bias without collapsing
  // variety: on-brand heroes should dominate, yet several distinct heroes appear.
  const luxeFavored = new Set([
    'editorial', 'refined', 'portrait', 'gallery', 'spotlight', 'framed', 'cinematic',
  ]);
  const heroes: string[] = [];
  for (let i = 0; i < 400; i++) {
    heroes.push(getDesignVariant(`brand-${i}`, 'luxury-minimal').hero);
  }

  it('biases toward on-brand heroes (majority favored)', () => {
    const favored = heroes.filter((h) => luxeFavored.has(h)).length;
    expect(favored / heroes.length).toBeGreaterThan(0.6);
  });

  it('still produces variety (multiple distinct heroes)', () => {
    expect(new Set(heroes).size).toBeGreaterThanOrEqual(5);
  });

  it('keeps every hero reachable (floor weight of 1)', () => {
    // A non-favored hero should still occur across a large sample.
    expect(heroes.some((h) => !luxeFavored.has(h))).toBe(true);
  });
});
