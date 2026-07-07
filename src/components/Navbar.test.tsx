import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Navbar from './Navbar';
import type { NavComposition } from '@/lib/designVariants';
import type { NavLink } from '@/types/config';

// Smoke-tests the structural nav compositions.
// We test a representative sample of the 200 possible combinations.

const NAV_VARIANTS: NavComposition[] = [
  'classic::glass::fade',
  'centered-stack::solid::underline',
  'split-cta::transparent::overline',
  'boxed-floating::frosted-heavy::bracket',
  'two-tier-topbar::glass::pill',
  'sidebar-left::solid::fade',
  'bottom-floating::transparent::underline',
  'classic-reversed::frosted-heavy::overline',
  'mega-centered::glass::bracket',
  'minimal::solid::pill'
];

const LINKS: NavLink[] = [
  { label: 'Home', slug: '/' },
  { label: 'About Us', slug: '/about' },
  { label: 'Services', slug: '/services' },
  { label: 'Portfolio', slug: '/portfolio' },
  { label: 'Contact', slug: '/contact' },
];

function renderVariant(navStyle: NavComposition) {
  return renderToStaticMarkup(
    <Navbar
      brandName="Acme Closets"
      links={LINKS}
      themeName="luxury-minimal"
      fontSeed="test-seed"
      navStyle={navStyle}
      phone="(555) 010-0100"
    />
  );
}

describe('Navbar structural nav compositions', () => {
  it.each(NAV_VARIANTS)('renders %s without throwing', (navStyle) => {
    expect(() => renderVariant(navStyle)).not.toThrow();
  });

  it.each(NAV_VARIANTS)('%s includes brand name', (navStyle) => {
    const html = renderVariant(navStyle);
    expect(html).toContain('Acme Closets');
  });

  it('classic, centered-stack, split-cta and boxed-floating all show a "Get Quote" CTA button', () => {
    for (const navStyle of ['classic::glass::fade', 'centered-stack::glass::fade', 'split-cta::glass::fade', 'boxed-floating::glass::fade', 'two-tier-topbar::glass::fade'] as NavComposition[]) {
      expect(renderVariant(navStyle)).toContain('Get Quote');
    }
  });

  it('two-tier-topbar renders the utility bar with the phone number', () => {
    expect(renderVariant('two-tier-topbar::glass::fade')).toContain('(555) 010-0100');
  });

  it('boxed-floating uses an inset rounded container, not a full-bleed bar', () => {
    expect(renderVariant('boxed-floating::glass::fade')).toContain('rounded-2xl');
  });

  it('every variant produces structurally distinct markup', () => {
    const rendered = NAV_VARIANTS.map(renderVariant);
    const distinct = new Set(rendered);
    expect(distinct.size).toBe(NAV_VARIANTS.length);
  });

  it('defaults to the classic layout when navStyle is omitted', () => {
    const withDefault = renderToStaticMarkup(
      <Navbar brandName="Acme Closets" links={LINKS} themeName="luxury-minimal" fontSeed="test-seed" />
    );
    expect(withDefault).toBe(renderVariant('classic::glass::fade'));
  });
});
