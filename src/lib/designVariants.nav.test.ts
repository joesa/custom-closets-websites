import { describe, it, expect } from 'vitest';
import { getDesignVariant, type NavComposition } from './designVariants';

function sampleNav(theme: string | null, count = 400): NavComposition[] {
  const out: NavComposition[] = [];
  for (let i = 0; i < count; i++) {
    out.push(getDesignVariant(`brand-${i}`, theme).nav);
  }
  return out;
}

describe('nav composition selection', () => {
  it('is deterministic for a given seed + theme', () => {
    const a = getDesignVariant('summit-closets', 'luxury-minimal').nav;
    const b = getDesignVariant('summit-closets', 'luxury-minimal').nav;
    expect(a).toBe(b);
  });

  it('an empty seed falls back to the first preset (deterministic preview)', () => {
    expect(getDesignVariant('', 'luxury-minimal').nav).toBe(getDesignVariant('', 'luxury-minimal').nav);
  });

  it('biases luxury-minimal (luxe archetype) toward centered-stack / boxed-floating / mega-centered / minimal layouts', () => {
    const favoredLayouts = new Set(['centered-stack', 'boxed-floating', 'mega-centered', 'minimal']);
    const navs = sampleNav('luxury-minimal');
    const favoredCount = navs.filter((n) => favoredLayouts.has(n.split('::')[0])).length;
    // Expected to be weighted higher than uniform
    expect(favoredCount / navs.length).toBeGreaterThan(0.4);
  });

  it('biases brutalist (bold archetype) toward classic / split-cta / two-tier-topbar / classic-reversed layouts', () => {
    const favoredLayouts = new Set(['classic', 'split-cta', 'two-tier-topbar', 'classic-reversed']);
    const navs = sampleNav('brutalist');
    const favoredCount = navs.filter((n) => favoredLayouts.has(n.split('::')[0])).length;
    // Expected to be weighted higher than uniform
    expect(favoredCount / navs.length).toBeGreaterThan(0.4);
  });

  it('still produces variety per archetype (not collapsed to one value)', () => {
    const navs = sampleNav('luxury-minimal');
    expect(new Set(navs).size).toBeGreaterThanOrEqual(10);
  });

  it('keeps every component reachable (floor weight of 1) across enough samples', () => {
    const navs = sampleNav('luxury-minimal', 5000);
    const layouts = new Set(navs.map(n => n.split('::')[0]));
    const bgs = new Set(navs.map(n => n.split('::')[1]));
    const hovers = new Set(navs.map(n => n.split('::')[2]));

    // 9 layouts (bottom-floating is retired from auto rotation), 4 bgs, 5 hovers
    expect(layouts.size).toBe(9);
    expect(layouts.has('bottom-floating')).toBe(false);
    expect(bgs.size).toBe(4);
    expect(hovers.size).toBe(5);
  });

  it('never auto-composes the retired bottom-floating layout for any seed', () => {
    for (const theme of ['luxury-minimal', 'brutalist', 'fresh-clean', null]) {
      for (const nav of sampleNav(theme, 2000)) {
        expect(nav.split('::')[0]).not.toBe('bottom-floating');
      }
    }
  });

  it('falls back to uniform hashing for unknown/absent themes', () => {
    const navs = sampleNav(null, 5000);
    const counts = new Map<string, number>();
    for (const nav of navs) {
      const layout = nav.split('::')[0];
      counts.set(layout, (counts.get(layout) ?? 0) + 1);
    }
    // Uniform over 10 hash buckets across 5000 samples = ~500 each, except
    // boxed-floating also absorbs the retired bottom-floating bucket (~1000).
    for (const [layout, count] of counts.entries()) {
      if (layout === 'boxed-floating') {
        expect(count).toBeGreaterThan(800);
        expect(count).toBeLessThan(1200);
      } else {
        expect(count).toBeGreaterThan(400);
        expect(count).toBeLessThan(600);
      }
    }
  });

  it('named presets each have a nav value from the composite axis', () => {
    const preset = getDesignVariant('atelier', null);
    const parts = preset.nav.split('::');
    expect(parts.length).toBe(3); // layout::bg::hover
  });
});
