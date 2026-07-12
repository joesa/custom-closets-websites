/**
 * Design variants — structural composition diversity.
 *
 * The `theme` controls palette + typography and `layoutStyle` controls the
 * ORDER of sections. Neither changes the *composition* of a section, so two
 * sites that resolve to the same theme + layout used to render identically.
 *
 * A design variant is a curated, coherent "studio style": it changes HOW the
 * hero and key sections are composed (split-screen vs. cinematic vs. editorial,
 * left vs. centered, framed vs. full-bleed, type scale, section rhythm). Layered
 * on top of theme + layout, it makes two sites built from identical intake
 * criteria read like the work of two unrelated top-tier studios.
 *
 * Selection is deterministic per-site (seeded from a stable identity such as the
 * widget id or brand name) so a given site is always rendered the same way, but
 * different sites diverge. No database migration is required: when an explicit
 * `designVariant` seed is absent we derive one from the site identity.
 */

export type HeroComposition =
  | 'cinematic' // full-bleed image, overlay headline (classic, dramatic)
  | 'split' // two-column: solid text panel beside a tall image
  | 'editorial' // magazine: oversized headline, wide image offset below
  | 'gallery' // restrained type over a contained, framed image band
  | 'spotlight' // headline beside an inset, rounded image card
  | 'refined' // minimal, negative-space-forward, small framed image
  | 'framed' // full-bleed image inside a bordered "window" frame
  | 'sidebar' // tall image rail beside a wide content column
  | 'overlap' // image banner with a content card overlapping its base
  | 'stacked' // eyebrow + headline + CTA above an edge-to-edge image strip
  | 'duotone' // full-bleed image under an accent-tinted scrim, brand eyebrow
  | 'diptych' // two side-by-side images with a centered text card on the seam
  | 'ribbon' // full-bleed image, headline set on a solid accent ribbon band
  | 'portrait' // tall centered portrait image with headline overlaid at base
  | 'masthead' // newspaper masthead: ruled brand line, big headline, image band
  | 'canvas'; // tiny centered image "stamp" above an oversized centered headline

export type AboutComposition =
  | 'centered'
  | 'aside'
  | 'statement'
  | 'bordered'
  | 'columns';

export type PortfolioComposition =
  | 'grid'
  | 'editorial'
  | 'showcase'
  | 'masonry'
  | 'framed';

export type TypeScale = 'compact' | 'standard' | 'oversized' | 'monumental';

export type HeroAlign = 'center' | 'left';

export type NavLayout = 
  | 'classic'
  | 'centered-stack'
  | 'split-cta'
  | 'boxed-floating'
  | 'two-tier-topbar'
  | 'sidebar-left'
  | 'bottom-floating'
  | 'classic-reversed'
  | 'mega-centered'
  | 'minimal';

export type NavBackground = 'glass' | 'solid' | 'transparent' | 'frosted-heavy';
export type NavHover = 'fade' | 'underline' | 'overline' | 'bracket' | 'pill';

export type NavComposition = `${NavLayout}::${NavBackground}::${NavHover}`;

export interface DesignVariant {
  /** Stable key (preset id, or `auto:<hero>` for procedurally-composed sites). */
  id: string;
  /** Human label for admin UI (preset name, or "Auto" for procedural). */
  label: string;
  hero: HeroComposition;
  /** Hero text alignment for compositions that support it. */
  heroAlign: HeroAlign;
  about: AboutComposition;
  portfolio: PortfolioComposition;
  /** Overall headline scale bucket. */
  typeScale: TypeScale;
  /** Structural navigation bar composition (multi-page sites). */
  nav: NavComposition;
}

// ─── Structural axes (every value below is backed by a real render branch) ───

const HERO_AXIS: HeroComposition[] = [
  'cinematic',
  'split',
  'editorial',
  'gallery',
  'spotlight',
  'refined',
  'framed',
  'sidebar',
  'overlap',
  'stacked',
  'duotone',
  'diptych',
  'ribbon',
  'portrait',
  'masthead',
  'canvas',
];

const ALIGN_AXIS: HeroAlign[] = ['center', 'left'];

const ABOUT_AXIS: AboutComposition[] = [
  'centered',
  'aside',
  'statement',
  'bordered',
  'columns',
];

const PORTFOLIO_AXIS: PortfolioComposition[] = [
  'grid',
  'editorial',
  'showcase',
  'masonry',
  'framed',
];

const TYPE_AXIS: TypeScale[] = ['compact', 'standard', 'oversized', 'monumental'];

const NAV_LAYOUT_AXIS: NavLayout[] = [
  'classic',
  'centered-stack',
  'split-cta',
  'boxed-floating',
  'two-tier-topbar',
  'sidebar-left',
  'bottom-floating',
  'classic-reversed',
  'mega-centered',
  'minimal'
];

const NAV_BG_AXIS: NavBackground[] = ['glass', 'solid', 'transparent', 'frosted-heavy'];
const NAV_HOVER_AXIS: NavHover[] = ['fade', 'underline', 'overline', 'bracket', 'pill'];

const NAV_AXIS: NavComposition[] = [];
for (const layout of NAV_LAYOUT_AXIS) {
  for (const bg of NAV_BG_AXIS) {
    for (const hover of NAV_HOVER_AXIS) {
      NAV_AXIS.push(`${layout}::${bg}::${hover}` as NavComposition);
    }
  }
}

/**
 * Deterministic 32-bit FNV-1a hash. Stable across runtimes (no Math.random),
 * so a given seed always maps to the same variant in dev, build and prod.
 */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Pick an axis value from a salted seed hash. */
function axisPick<T>(seed: string, salt: string, axis: T[]): T {
  return axis[hashSeed(`${seed}::${salt}`) % axis.length];
}

// ─── Answer-optimized weighting ──────────────────────────────────────────────
// The theme is the distilled signal of the brand's answers (vibe/tone/clientele
// all feed the theme choice upstream). So we bias the two most brand-defining
// structural axes — the hero composition and the type scale — toward values that
// *fit* the theme's mood, instead of picking uniformly. Weighting is SOFT: every
// value keeps a floor weight of 1, so the whole space stays reachable and two
// sites on the same theme still diverge — they just diverge among on-brand looks.
// (align/about/portfolio stay uniform to preserve secondary-axis variety, and
// fonts/accents are already constrained to on-brand pools per theme.)

export type DesignArchetype = 'luxe' | 'editorial' | 'modern' | 'bold' | 'playful';

/** Theme → structural mood. Unknown themes fall back to uniform picking. */
const THEME_ARCHETYPE: Record<string, DesignArchetype> = {
  'luxury-minimal': 'luxe',
  'brutalist': 'bold',
  'classic-warm': 'editorial',
  'modern-office': 'modern',
  'playful-kids': 'playful',
  'rustic-pantry': 'editorial',
  'sleek-entertainment': 'modern',
  'elegant-dressing': 'luxe',
  'functional-utility': 'modern',
  'creative-craft': 'playful',
  'sophisticated-wine': 'luxe',
  'cozy-library': 'editorial',
  'minimalist-zen': 'modern',
  'garage-industrial': 'bold',
  'pantry-fresh': 'editorial',
  'laundry-clean': 'modern',
  'mudroom-family': 'editorial',
  'commercial-pro': 'modern',
  'coastal-climate': 'luxe',
  'historic-classic': 'editorial',
  'luxury-gallery': 'luxe',
  'kids-playful': 'playful',
  'media-theater': 'modern',
  'office-executive': 'modern',
  'wine-cellar': 'luxe',

  // New trade-vertical themes
  'fresh-clean': 'modern',
  'warm-handyman': 'editorial',
  'rich-flooring': 'editorial',
  'artisan-wood': 'editorial',
  'swift-mobile': 'modern',
  'clean-move': 'modern',
  'urban-reclaim': 'bold',
  'stone-masonry': 'bold',
  'appliance-pro': 'modern',
  'care-comfort': 'playful',

  // Second wave
  'pool-resort': 'luxe',
  'home-guardian': 'modern',
  'eco-solar': 'modern',
  'pastoral-pet': 'playful',
  'hearth-warm': 'editorial',
  'seasonal-outdoor': 'modern',
  'garage-smart': 'modern',
  'window-light': 'luxe',

  // Third wave
  'bold-remodel': 'bold',
  'winter-ready': 'modern',
  'event-festive': 'playful',
  'wellness-calm': 'modern',
  'fleet-logistics': 'modern',
  'media-creative': 'modern',
  'gourmet-warm': 'editorial',
};

/** Build a full weight vector of `len` with a floor of 1 plus per-index boosts. */
function weightVector(len: number, boosts: Record<number, number>): number[] {
  return Array.from({ length: len }, (_, i) => 1 + (boosts[i] ?? 0));
}

// HERO_AXIS index map: 0 cinematic,1 split,2 editorial,3 gallery,4 spotlight,
// 5 refined,6 framed,7 sidebar,8 overlap,9 stacked,10 duotone,11 diptych,
// 12 ribbon,13 portrait,14 masthead,15 canvas.
const HERO_WEIGHTS: Record<DesignArchetype, number[]> = {
  luxe:      weightVector(16, { 2: 4, 5: 4, 13: 3, 3: 2, 4: 2, 6: 2, 0: 1 }),
  editorial: weightVector(16, { 2: 3, 14: 3, 6: 2, 7: 2, 8: 2, 3: 1 }),
  modern:    weightVector(16, { 1: 3, 7: 3, 9: 2, 10: 2, 4: 2, 15: 1 }),
  bold:      weightVector(16, { 0: 4, 12: 3, 14: 3, 10: 2, 15: 2 }),
  playful:   weightVector(16, { 15: 4, 11: 3, 3: 3, 4: 2, 13: 2, 12: 1 }),
};

// TYPE_AXIS index map: 0 compact, 1 standard, 2 oversized, 3 monumental.
const TYPE_WEIGHTS: Record<DesignArchetype, number[]> = {
  luxe:      weightVector(4, { 2: 3, 3: 3, 1: 1 }),
  editorial: weightVector(4, { 1: 3, 2: 2 }),
  modern:    weightVector(4, { 0: 3, 1: 3 }),
  bold:      weightVector(4, { 3: 4, 2: 2 }),
  playful:   weightVector(4, { 2: 3, 1: 2 }),
};

// NAV_LAYOUT_AXIS index map: 0 classic, 1 centered-stack, 2 split-cta, 3 boxed-floating,
// 4 two-tier-topbar, 5 sidebar-left, 6 bottom-floating, 7 classic-reversed, 8 mega-centered, 9 minimal.
const NAV_LAYOUT_WEIGHTS: Record<DesignArchetype, number[]> = {
  luxe:      weightVector(10, { 1: 3, 3: 2, 8: 2, 9: 1 }),
  editorial: weightVector(10, { 1: 3, 4: 2, 5: 1, 0: 1 }),
  modern:    weightVector(10, { 2: 3, 3: 2, 6: 1, 8: 1 }),
  bold:      weightVector(10, { 0: 3, 2: 2, 4: 1, 7: 1 }),
  playful:   weightVector(10, { 3: 3, 1: 2, 2: 1, 6: 2 }),
};

// NAV_BG_AXIS index map: 0 glass, 1 solid, 2 transparent, 3 frosted-heavy
const NAV_BG_WEIGHTS: Record<DesignArchetype, number[]> = {
  luxe:      weightVector(4, { 0: 3, 3: 2 }),
  editorial: weightVector(4, { 1: 3, 2: 2 }),
  modern:    weightVector(4, { 0: 2, 3: 3 }),
  bold:      weightVector(4, { 1: 4 }),
  playful:   weightVector(4, { 0: 2, 2: 2 }),
};

// NAV_HOVER_AXIS index map: 0 fade, 1 underline, 2 overline, 3 bracket, 4 pill
const NAV_HOVER_WEIGHTS: Record<DesignArchetype, number[]> = {
  luxe:      weightVector(5, { 1: 3, 0: 2 }),
  editorial: weightVector(5, { 2: 3, 1: 2 }),
  modern:    weightVector(5, { 4: 3, 1: 2 }),
  bold:      weightVector(5, { 3: 4, 1: 1 }),
  playful:   weightVector(5, { 4: 4, 0: 2 }),
};

/**
 * Seeded pick over a discrete weighted distribution. Deterministic: the same
 * (seed, salt, weights) always yields the same index. Integer weights only.
 */
function weightedIndex(seed: string, salt: string, weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = hashSeed(`${seed}::${salt}`) % total;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) return i;
    r -= weights[i];
  }
  return weights.length - 1;
}

/** Chosen hero index for a seed, biased toward the theme's archetype. */
function heroIndex(seed: string, theme?: string | null): number {
  const arch = theme ? THEME_ARCHETYPE[theme] : undefined;
  if (!arch) return hashSeed(`${seed}::hero`) % HERO_AXIS.length;
  return weightedIndex(seed, 'hero', HERO_WEIGHTS[arch]);
}

/** Chosen type-scale index for a seed, biased toward the theme's archetype. */
function typeIndex(seed: string, theme?: string | null): number {
  const arch = theme ? THEME_ARCHETYPE[theme] : undefined;
  if (!arch) return hashSeed(`${seed}::type`) % TYPE_AXIS.length;
  return weightedIndex(seed, 'type', TYPE_WEIGHTS[arch]);
}

/** Chosen nav layout index for a seed, biased toward the theme's archetype. */
function navLayoutIndex(seed: string, theme?: string | null): number {
  const arch = theme ? THEME_ARCHETYPE[theme] : undefined;
  if (!arch) return hashSeed(`${seed}::navLayout`) % NAV_LAYOUT_AXIS.length;
  return weightedIndex(seed, 'navLayout', NAV_LAYOUT_WEIGHTS[arch]);
}

/** Chosen nav bg index for a seed. */
function navBgIndex(seed: string, theme?: string | null): number {
  const arch = theme ? THEME_ARCHETYPE[theme] : undefined;
  if (!arch) return hashSeed(`${seed}::navBg`) % NAV_BG_AXIS.length;
  return weightedIndex(seed, 'navBg', NAV_BG_WEIGHTS[arch]);
}

/** Chosen nav hover index for a seed. */
function navHoverIndex(seed: string, theme?: string | null): number {
  const arch = theme ? THEME_ARCHETYPE[theme] : undefined;
  if (!arch) return hashSeed(`${seed}::navHover`) % NAV_HOVER_AXIS.length;
  return weightedIndex(seed, 'navHover', NAV_HOVER_WEIGHTS[arch]);
}

/**
 * Procedurally compose a fully independent structural combination from a seed.
 * The hero and type-scale axes are weighted toward the theme's archetype (an
 * answer-optimized "fit"); align/about/portfolio remain uniform for variety.
 * Each axis uses a different salt, so the axes stay uncorrelated. The reachable
 * space is still HERO×ALIGN×ABOUT×PORTFOLIO×TYPE = 16×2×5×5×4 = 3,200 layouts —
 * weighting shifts the *likelihood* within it, never removes a value.
 */
export function composeVariant(seed: string, theme?: string | null): DesignVariant {
  const hero = HERO_AXIS[heroIndex(seed, theme)];
  // 'bottom-floating' is retired from the auto rotation: real visitors read a
  // bottom-pinned nav as a broken header (and the top of the page is left with
  // no navigation at all), which undermines trust on a lead-gen site. Seeds
  // that land on it are remapped to its top-anchored twin, boxed-floating,
  // instead of removing the axis entry — dropping the entry would change the
  // modulo arithmetic and silently re-roll the nav of every existing site.
  // The render branch in Navbar.tsx stays for any explicitly-stored config.
  let navLayout = NAV_LAYOUT_AXIS[navLayoutIndex(seed, theme)];
  if (navLayout === 'bottom-floating') navLayout = 'boxed-floating';
  return {
    id: `auto:${hero}`,
    label: 'Auto (seeded)',
    hero,
    heroAlign: axisPick(seed, 'align', ALIGN_AXIS),
    about: axisPick(seed, 'about', ABOUT_AXIS),
    portfolio: axisPick(seed, 'portfolio', PORTFOLIO_AXIS),
    typeScale: TYPE_AXIS[typeIndex(seed, theme)],
    nav: `${navLayout}::${NAV_BG_AXIS[navBgIndex(seed, theme)]}::${NAV_HOVER_AXIS[navHoverIndex(seed, theme)]}` as NavComposition,
  };
}

// ─── Named studio presets (admin override / preview) ───

/**
 * 56 curated "studio style" names. Each maps to a distinct structural
 * permutation generated by walking coprime strides across the axes, so the
 * presets spread broadly across the combination space instead of clustering.
 */
const STUDIO_NAMES: string[] = [
  'atelier', 'broadsheet', 'pavilion', 'salon', 'manifesto', 'reverie',
  'beacon', 'monolith', 'lumen', 'vellum', 'cascade', 'harbor',
  'meridian', 'aria', 'foundry', 'lattice', 'marble', 'ember',
  'copper', 'slate', 'ivory', 'cobalt', 'verdant', 'dune',
  'cirrus', 'tundra', 'quarry', 'basalt', 'zephyr', 'halcyon',
  'obsidian', 'porcelain', 'atrium', 'loft', 'terrace', 'cornice',
  'plinth', 'frieze', 'rotunda', 'alcove', 'mantle', 'horizon',
  'vantage', 'summit', 'equinox', 'solstice', 'prism', 'facet',
  'contour', 'cadence', 'tempo', 'vector', 'helix', 'nimbus',
  'quartz', 'onyx',
];

function titleCase(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * Curated, coherent studio styles. Generated by spreading each axis with a
 * stride that is coprime to that axis length so every value is exercised and
 * adjacent presets differ on multiple axes at once.
 */
const PRESETS: DesignVariant[] = STUDIO_NAMES.map((name, i) => ({
  id: name,
  label: titleCase(name),
  hero: HERO_AXIS[i % HERO_AXIS.length],
  heroAlign: ALIGN_AXIS[i % ALIGN_AXIS.length],
  about: ABOUT_AXIS[(i * 3) % ABOUT_AXIS.length],
  portfolio: PORTFOLIO_AXIS[(i * 2) % PORTFOLIO_AXIS.length],
  typeScale: TYPE_AXIS[(i * 3) % TYPE_AXIS.length],
  nav: `${NAV_LAYOUT_AXIS[(i * 5) % NAV_LAYOUT_AXIS.length]}::${NAV_BG_AXIS[(i * 7) % NAV_BG_AXIS.length]}::${NAV_HOVER_AXIS[(i * 11) % NAV_HOVER_AXIS.length]}` as NavComposition,
}));

const PRESET_BY_ID = new Map(PRESETS.map((p) => [p.id, p]));

/** Lightweight list for admin dropdowns: the "Auto" option plus every preset. */
export const DESIGN_VARIANT_OPTIONS: Array<{ id: string; label: string }> = [
  { id: '', label: 'Auto (seeded — unique per site)' },
  ...PRESETS.map((p) => ({ id: p.id, label: p.label })),
];

/** True when `id` names a known preset (used to validate admin input). */
export function isPresetId(id?: string | null): boolean {
  return !!id && PRESET_BY_ID.has(id.trim());
}

/**
 * Resolve the design variant for a site.
 *  - A seed that exactly matches a preset id forces that named studio style.
 *  - Any other non-empty seed (widget id, brand name, …) is composed
 *    procedurally into a unique structural combination, biased toward the
 *    theme's archetype when a theme is supplied.
 *  - An empty seed falls back to the first preset for deterministic previews.
 */
export function getDesignVariant(seed?: string | null, theme?: string | null): DesignVariant {
  const key = (seed ?? '').trim();
  if (!key) return PRESETS[0];
  const preset = PRESET_BY_ID.get(key);
  if (preset) return preset;
  return composeVariant(key, theme);
}

/**
 * The single, canonical seed for a site's entire visual "voice" — structural
 * composition, typography and accent color all derive from this one value so a
 * stored seed reproduces the whole look. Precedence: an explicit resolved
 * design seed (or admin preset id) wins, else the stable site identity.
 */
export function siteSeed(c: {
  designVariant?: string | null;
  widgetId?: string | null;
  brandName?: string | null;
}): string {
  return (c.designVariant || c.widgetId || c.brandName || '').trim();
}

/** Fixed structural axis lengths — mirrored by the dashboard fingerprint. */
export const DESIGN_AXIS_LENGTHS = {
  hero: HERO_AXIS.length,
  align: ALIGN_AXIS.length,
  about: ABOUT_AXIS.length,
  portfolio: PORTFOLIO_AXIS.length,
  type: TYPE_AXIS.length,
} as const;

/**
 * The structural half of a site's design fingerprint: the five composition axis
 * indices, joined stably. Uses the exact same weighted/uniform picks as
 * `composeVariant` (hero + type biased by the theme's archetype, the rest
 * uniform) so it always agrees with what is rendered. The typographic/color
 * half is appended by `designFingerprint` in theme.ts (which has the voice pools).
 *
 * `nav` is intentionally NOT part of this fingerprint: it's a presentation-only
 * axis (like a 6th, purely additive dimension of variety) and isn't needed for
 * the collision-avoidance uniqueness checks that consume this string. Keeping it
 * out avoids changing the fingerprint format (which is pinned cross-app, see
 * closet-dashboard/src/lib/catalog/designFingerprint.ts).
 */
export function structuralFingerprint(seed: string, theme?: string | null): string {
  return [
    heroIndex(seed, theme),
    hashSeed(`${seed}::align`) % ALIGN_AXIS.length,
    hashSeed(`${seed}::about`) % ABOUT_AXIS.length,
    hashSeed(`${seed}::portfolio`) % PORTFOLIO_AXIS.length,
    typeIndex(seed, theme),
  ].join('.');
}

/** Headline size classes per type scale, used by the hero compositions. */
export function heroHeadlineClasses(scale: TypeScale): string {
  switch (scale) {
    case 'monumental':
      return 'text-6xl md:text-9xl leading-[0.9] tracking-[-0.04em]';
    case 'oversized':
      return 'text-5xl md:text-8xl leading-[0.98] tracking-[-0.03em]';
    case 'compact':
      return 'text-4xl md:text-5xl leading-snug tracking-[0.01em]';
    case 'standard':
    default:
      return 'text-5xl md:text-7xl leading-tight tracking-[-0.02em]';
  }
}
