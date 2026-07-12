import { ThemeType } from '@/types/config';
import { hashSeed, structuralFingerprint } from '@/lib/designVariants';

export type ThemeStyles = {
  pageBackground: string;
  textPrimary: string;
  textSecondary: string;
  headingFont: string;
  bodyFont: string;
  containerClasses: string;
  button: string;
  productCard: string;
  productImageHover: string;
  accentColor: string;
  heroGradient: string;
};

/**
 * A "synthesized" theme selection: instead of picking one of the ~47
 * hand-authored ThemeType palettes below, a site can be assembled on the fly
 * from four independent, curated token pools (surface, shape, voice, swatch).
 * Every value referenced by a token is a literal Tailwind class string that
 * already exists in this file (see SURFACE_POOL / SHAPE_POOL / SWATCH /
 * HEADING_VOICE / BODY_VOICE below) — Tailwind's scanner only emits classes it
 * can find as literal source text, so tokens are IDs into pre-authored pools,
 * never freeform/AI-generated CSS.
 *
 * `theme` (ThemeType) is still stored/used alongside tokens for anything not
 * covered by the token pools (e.g. hero stock photo, layout affinity) — when
 * `tokens` is present it takes over the actual visual styling.
 */
export type ThemeTokenSelection = {
  surface: string;
  shape: string;
  voice: string;
  swatch: string;
};

/** Curated background/text/gradient bundles for synthesized themes. */
const SURFACE_POOL: Record<
  string,
  {
    pageBackground: string;
    textPrimary: string;
    textSecondary: string;
    heroGradient: string;
    isDark: boolean;
    surfaceClasses: string;
    surfaceBorderClasses: string;
  }
> = {
  'warm-light': {
    pageBackground: 'bg-white',
    textPrimary: 'text-stone-900',
    textSecondary: 'text-stone-500',
    heroGradient: 'bg-gradient-to-t from-black/60 via-black/20 to-transparent',
    isDark: false,
    surfaceClasses: 'bg-stone-50',
    surfaceBorderClasses: 'border-stone-200',
  },
  'cool-light': {
    pageBackground: 'bg-slate-50',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    heroGradient: 'bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent',
    isDark: false,
    surfaceClasses: 'bg-white',
    surfaceBorderClasses: 'border-slate-200',
  },
  'soft-cream': {
    pageBackground: 'bg-[#faf8f5]',
    textPrimary: 'text-amber-950',
    textSecondary: 'text-amber-900/70',
    heroGradient: 'bg-gradient-to-t from-amber-950/80 via-amber-950/30 to-transparent',
    isDark: false,
    surfaceClasses: 'bg-white',
    surfaceBorderClasses: 'border-amber-900/10',
  },
  'fresh-sky': {
    pageBackground: 'bg-sky-50',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-slate-500',
    heroGradient: 'bg-gradient-to-t from-sky-900/50 to-transparent',
    isDark: false,
    surfaceClasses: 'bg-white',
    surfaceBorderClasses: 'border-sky-200',
  },
  'quiet-sage': {
    pageBackground: 'bg-[#f4f1ea]',
    textPrimary: 'text-[#3e4539]',
    textSecondary: 'text-[#5a6254]',
    heroGradient: 'bg-gradient-to-t from-[#3e4539]/80 to-transparent',
    isDark: false,
    surfaceClasses: 'bg-[#ece8df]',
    surfaceBorderClasses: 'border-[#515c4a]/20',
  },
  'deep-charcoal': {
    pageBackground: 'bg-zinc-950',
    textPrimary: 'text-zinc-100',
    textSecondary: 'text-zinc-400',
    heroGradient: 'bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent',
    isDark: true,
    surfaceClasses: 'bg-zinc-900',
    surfaceBorderClasses: 'border-zinc-800',
  },
  'midnight-slate': {
    pageBackground: 'bg-slate-900',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    heroGradient: 'bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent',
    isDark: true,
    surfaceClasses: 'bg-slate-800',
    surfaceBorderClasses: 'border-slate-700',
  },
  'rich-espresso': {
    pageBackground: 'bg-[#2c241b]',
    textPrimary: 'text-[#eaddcf]',
    textSecondary: 'text-[#a89785]',
    heroGradient: 'bg-gradient-to-t from-[#2c241b] via-[#2c241b]/90 to-transparent',
    isDark: true,
    surfaceClasses: 'bg-[#362c22]',
    surfaceBorderClasses: 'border-[#4a3d2f]',
  },
};

/** Curated container/button/card shape bundles for synthesized themes (color-free — accent color comes from the chosen swatch). */
const SHAPE_POOL: Record<
  string,
  {
    containerClasses: string;
    buttonShape: string;
    productCard: string;
    productImageHover: string;
    headingModifier: string;
    bodyModifier: string;
  }
> = {
  'sharp-editorial': {
    containerClasses: 'max-w-6xl mx-auto px-8 py-32',
    buttonShape: 'rounded-none px-8 py-4 uppercase tracking-widest text-sm font-medium',
    productCard: 'group overflow-hidden rounded-none',
    productImageHover: 'transition-transform duration-1000 group-hover:scale-105',
    headingModifier: 'tracking-wide',
    bodyModifier: 'font-light',
  },
  'soft-modern': {
    containerClasses: 'max-w-6xl mx-auto px-6 py-24',
    buttonShape: 'rounded-md px-8 py-4 font-medium',
    productCard: 'group overflow-hidden rounded-xl shadow-md',
    productImageHover: 'transition-transform duration-500 group-hover:scale-105',
    headingModifier: 'font-bold tracking-tight',
    bodyModifier: '',
  },
  'rounded-friendly': {
    containerClasses: 'max-w-6xl mx-auto px-6 py-24',
    buttonShape: 'rounded-full px-8 py-4 font-bold text-lg shadow-lg',
    productCard: 'group overflow-hidden rounded-3xl shadow-xl',
    productImageHover: 'transition-transform duration-300 group-hover:scale-105',
    headingModifier: 'font-black tracking-tight',
    bodyModifier: '',
  },
  'structured-classic': {
    containerClasses: 'max-w-5xl mx-auto px-6 py-24',
    buttonShape: 'rounded-lg px-8 py-4 shadow-lg',
    productCard: 'group overflow-hidden rounded-2xl shadow-sm',
    productImageHover: 'transition-transform duration-700 group-hover:scale-105',
    headingModifier: '',
    bodyModifier: '',
  },
  'bold-block': {
    containerClasses: 'max-w-7xl mx-auto px-6 py-24',
    buttonShape: 'rounded-none px-8 py-4 uppercase font-bold text-base',
    productCard: 'group overflow-hidden rounded-none',
    productImageHover: 'transition-transform duration-500 group-hover:scale-105',
    headingModifier: 'font-black tracking-tighter uppercase',
    bodyModifier: '',
  },
  'quiet-minimal': {
    containerClasses: 'max-w-4xl mx-auto px-12 py-32',
    buttonShape: 'rounded-none px-12 py-4 uppercase tracking-[0.3em] text-xs',
    productCard: 'group overflow-hidden rounded-none',
    productImageHover: 'transition-transform duration-1000 group-hover:scale-105',
    headingModifier: 'font-light tracking-widest uppercase',
    bodyModifier: 'font-light',
  },
};

export const SURFACE_POOL_IDS = Object.keys(SURFACE_POOL);
export const SHAPE_POOL_IDS = Object.keys(SHAPE_POOL);

function coreThemeStyles(theme: ThemeType): ThemeStyles {
  switch (theme) {
    case 'luxury-minimal':
      return {
        pageBackground: 'bg-white',
        textPrimary: 'text-stone-900',
        textSecondary: 'text-stone-500',
        headingFont: 'font-cormorant tracking-wide',
        bodyFont: 'font-manrope font-light',
        containerClasses: 'max-w-6xl mx-auto px-8 py-32',
        button: 'bg-stone-900 text-white hover:bg-stone-800 transition-colors rounded-none px-8 py-4 uppercase tracking-widest text-sm',
        productCard: 'group overflow-hidden rounded-none',
        productImageHover: 'transition-transform duration-1000 group-hover:scale-105',
        accentColor: 'text-amber-700',
        heroGradient: 'bg-gradient-to-t from-black/60 via-black/20 to-transparent',
      };
    case 'brutalist':
      return {
        pageBackground: 'bg-[#050505]',
        textPrimary: 'text-white',
        textSecondary: 'text-slate-400',
        headingFont: 'font-archivo font-black tracking-tighter uppercase',
        bodyFont: 'font-space-grotesk',
        containerClasses: 'max-w-7xl mx-auto px-6 py-24',
        button: 'bg-yellow-400 text-black hover:bg-yellow-300 transition-colors rounded-none px-8 py-4 uppercase font-bold text-base border-2 border-yellow-400',
        productCard: 'group overflow-hidden rounded-none border border-white/10 bg-white/[0.02]',
        productImageHover: 'grayscale transition-all duration-500 group-hover:grayscale-0',
        accentColor: 'text-yellow-400',
        heroGradient: 'bg-black/60',
      };
    case 'classic-warm':
      return {
        pageBackground: 'bg-[#faf8f5]',
        textPrimary: 'text-amber-950',
        textSecondary: 'text-amber-900/70',
        headingFont: 'font-dm-serif',
        bodyFont: 'font-lora',
        containerClasses: 'max-w-5xl mx-auto px-6 py-24',
        button: 'bg-amber-800 text-white hover:bg-amber-900 transition-colors rounded-lg px-8 py-4 shadow-lg hover:shadow-xl',
        productCard: 'group overflow-hidden rounded-2xl bg-white shadow-sm border border-amber-900/5',
        productImageHover: 'transition-transform duration-700 group-hover:scale-105',
        accentColor: 'text-amber-800',
        heroGradient: 'bg-gradient-to-t from-amber-950/80 via-amber-950/30 to-transparent',
      };
    case 'modern-office':
      return {
        pageBackground: 'bg-slate-50',
        textPrimary: 'text-slate-900',
        textSecondary: 'text-slate-600',
        headingFont: 'font-space-grotesk font-bold tracking-tight',
        bodyFont: 'font-manrope',
        containerClasses: 'max-w-7xl mx-auto px-6 py-24',
        button: 'bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-md px-8 py-4 font-medium',
        productCard: 'group overflow-hidden rounded-xl bg-white shadow-md',
        productImageHover: 'transition-transform duration-500 group-hover:scale-105',
        accentColor: 'text-blue-600',
        heroGradient: 'bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent',
      };
    case 'playful-kids':
      return {
        pageBackground: 'bg-sky-50',
        textPrimary: 'text-slate-800',
        textSecondary: 'text-slate-600',
        headingFont: 'font-syne font-black tracking-tight',
        bodyFont: 'font-manrope',
        containerClasses: 'max-w-6xl mx-auto px-6 py-24',
        button: 'bg-rose-500 text-white hover:bg-rose-600 transition-transform hover:scale-105 rounded-full px-8 py-4 font-bold text-lg shadow-lg',
        productCard: 'group overflow-hidden rounded-3xl bg-white shadow-xl border-4 border-transparent hover:border-rose-400 transition-all',
        productImageHover: 'transition-transform duration-300 group-hover:rotate-1 group-hover:scale-105',
        accentColor: 'text-rose-500',
        heroGradient: 'bg-gradient-to-t from-sky-900/60 to-transparent',
      };
    case 'rustic-pantry':
      return {
        pageBackground: 'bg-[#f4f1ea]',
        textPrimary: 'text-[#3e4539]',
        textSecondary: 'text-[#5a6254]',
        headingFont: 'font-fraunces font-bold',
        bodyFont: 'font-libre-baskerville',
        containerClasses: 'max-w-5xl mx-auto px-6 py-24',
        button: 'bg-[#515c4a] text-white hover:bg-[#3e4539] transition-colors rounded-sm px-8 py-4 uppercase tracking-wider',
        productCard: 'group overflow-hidden bg-[#ece8df] border-2 border-[#515c4a]/10',
        productImageHover: 'transition-transform duration-700 group-hover:scale-105',
        accentColor: 'text-[#515c4a]',
        heroGradient: 'bg-gradient-to-t from-[#3e4539]/80 to-transparent',
      };
    case 'sleek-entertainment':
      return {
        pageBackground: 'bg-zinc-950',
        textPrimary: 'text-zinc-100',
        textSecondary: 'text-zinc-400',
        headingFont: 'font-space-grotesk font-bold uppercase tracking-widest',
        bodyFont: 'font-manrope',
        containerClasses: 'max-w-7xl mx-auto px-6 py-24',
        button: 'bg-cyan-500 text-black hover:bg-cyan-400 transition-colors rounded-none px-8 py-4 font-bold tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)]',
        productCard: 'group overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 transition-colors',
        productImageHover: 'transition-transform duration-500 group-hover:scale-105',
        accentColor: 'text-cyan-400',
        heroGradient: 'bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent',
      };
    case 'elegant-dressing':
      return {
        pageBackground: 'bg-[#fffaf0]',
        textPrimary: 'text-[#4a3f35]',
        textSecondary: 'text-[#8a7f75]',
        headingFont: 'font-cormorant font-medium italic',
        bodyFont: 'font-manrope font-light',
        containerClasses: 'max-w-6xl mx-auto px-8 py-32',
        button: 'bg-[#d4af37] text-white hover:bg-[#b5952f] transition-colors rounded-full px-10 py-4 uppercase tracking-widest text-sm shadow-md',
        productCard: 'group overflow-hidden rounded-t-full bg-white shadow-sm',
        productImageHover: 'transition-transform duration-1000 group-hover:scale-110',
        accentColor: 'text-[#d4af37]',
        heroGradient: 'bg-gradient-to-t from-[#4a3f35]/60 to-transparent',
      };
    case 'functional-utility':
      return {
        pageBackground: 'bg-white',
        textPrimary: 'text-neutral-900',
        textSecondary: 'text-neutral-500',
        headingFont: 'font-manrope font-semibold tracking-tight',
        bodyFont: 'font-manrope',
        containerClasses: 'max-w-6xl mx-auto px-6 py-20',
        button: 'bg-neutral-900 text-white hover:bg-neutral-800 transition-colors rounded px-6 py-3 font-medium',
        productCard: 'group overflow-hidden rounded bg-neutral-50 border border-neutral-100',
        productImageHover: 'transition-opacity duration-300 hover:opacity-90',
        accentColor: 'text-blue-500',
        heroGradient: 'bg-gradient-to-t from-black/50 to-transparent',
      };
    case 'creative-craft':
      return {
        pageBackground: 'bg-purple-50',
        textPrimary: 'text-purple-950',
        textSecondary: 'text-purple-700/70',
        headingFont: 'font-syne font-bold',
        bodyFont: 'font-space-grotesk',
        containerClasses: 'max-w-7xl mx-auto px-8 py-24',
        button: 'bg-purple-600 text-white hover:bg-purple-500 transition-colors rounded-xl px-8 py-4 font-semibold shadow-lg shadow-purple-200',
        productCard: 'group overflow-hidden rounded-2xl bg-white shadow-xl shadow-purple-100 border border-purple-100',
        productImageHover: 'transition-transform duration-500 group-hover:scale-105',
        accentColor: 'text-purple-600',
        heroGradient: 'bg-gradient-to-t from-purple-900/70 to-transparent',
      };
    case 'sophisticated-wine':
      return {
        pageBackground: 'bg-[#1a1112]',
        textPrimary: 'text-[#e6d5cc]',
        textSecondary: 'text-[#a6958c]',
        headingFont: 'font-cormorant tracking-wider',
        bodyFont: 'font-lora',
        containerClasses: 'max-w-6xl mx-auto px-6 py-32',
        button: 'bg-[#5c1c24] text-[#e6d5cc] hover:bg-[#4a151d] transition-colors rounded-none px-10 py-4 uppercase tracking-[0.2em] border border-[#5c1c24]',
        productCard: 'group overflow-hidden bg-[#24181a] border border-[#362427]',
        productImageHover: 'transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100',
        accentColor: 'text-[#8c2a35]',
        heroGradient: 'bg-gradient-to-t from-[#1a1112] via-[#1a1112]/80 to-transparent',
      };
    case 'cozy-library':
      return {
        pageBackground: 'bg-[#2c241b]',
        textPrimary: 'text-[#eaddcf]',
        textSecondary: 'text-[#a89785]',
        headingFont: 'font-dm-serif',
        bodyFont: 'font-libre-baskerville',
        containerClasses: 'max-w-5xl mx-auto px-8 py-24',
        button: 'bg-[#8b5a2b] text-[#f4efe8] hover:bg-[#704822] transition-colors rounded px-8 py-3 font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]',
        productCard: 'group overflow-hidden rounded bg-[#362c22] border border-[#4a3d2f]',
        productImageHover: 'transition-transform duration-700 group-hover:scale-105',
        accentColor: 'text-[#d2a679]',
        heroGradient: 'bg-gradient-to-t from-[#2c241b] via-[#2c241b]/90 to-transparent',
      };
    case 'minimalist-zen':
      return {
        pageBackground: 'bg-[#faf9f7]',
        textPrimary: 'text-[#2a2b2a]',
        textSecondary: 'text-[#6b6e68]',
        headingFont: 'font-space-grotesk font-light tracking-widest uppercase',
        bodyFont: 'font-manrope font-light',
        containerClasses: 'max-w-4xl mx-auto px-12 py-32',
        button: 'bg-transparent text-[#2a2b2a] hover:bg-[#2a2b2a] hover:text-white transition-colors rounded-none px-12 py-4 uppercase tracking-[0.3em] text-xs border border-[#2a2b2a]',
        productCard: 'group overflow-hidden rounded-none',
        productImageHover: 'transition-transform duration-1000 group-hover:scale-105',
        accentColor: 'text-[#7d8276]',
        heroGradient: 'bg-gradient-to-t from-[#faf9f7]/80 to-transparent',
      };
    case 'pantry-fresh':
      return {
        ...coreThemeStyles('rustic-pantry'),
        pageBackground: 'bg-emerald-50/40',
        accentColor: 'text-emerald-800',
      };
    case 'laundry-clean':
      return {
        pageBackground: 'bg-sky-50',
        textPrimary: 'text-slate-800',
        textSecondary: 'text-slate-500',
        headingFont: 'font-space-grotesk font-semibold tracking-tight',
        bodyFont: 'font-manrope',
        containerClasses: 'max-w-6xl mx-auto px-6 py-20',
        button: 'bg-sky-600 text-white hover:bg-sky-700 transition-colors rounded-lg px-8 py-3 font-medium',
        productCard: 'group overflow-hidden rounded-xl bg-white border border-sky-100 shadow-sm',
        productImageHover: 'transition-transform duration-500 group-hover:scale-105',
        accentColor: 'text-sky-600',
        heroGradient: 'bg-gradient-to-t from-sky-900/50 to-transparent',
      };
    case 'coastal-climate':
      return {
        pageBackground: 'bg-slate-50',
        textPrimary: 'text-slate-800',
        textSecondary: 'text-slate-500',
        headingFont: 'font-cormorant tracking-wide',
        bodyFont: 'font-manrope font-light',
        containerClasses: 'max-w-6xl mx-auto px-8 py-28',
        button: 'bg-teal-700 text-white hover:bg-teal-800 transition-colors rounded-md px-8 py-4',
        productCard: 'group overflow-hidden rounded-lg bg-white shadow-md border border-teal-100',
        productImageHover: 'transition-transform duration-700 group-hover:scale-105',
        accentColor: 'text-teal-700',
        heroGradient: 'bg-gradient-to-t from-teal-950/60 via-teal-900/20 to-transparent',
      };
    case 'historic-classic':
      return {
        ...coreThemeStyles('classic-warm'),
        pageBackground: 'bg-[#f0ebe3]',
        textPrimary: 'text-stone-900',
      };
    case 'office-executive':
      return {
        ...coreThemeStyles('modern-office'),
        pageBackground: 'bg-slate-900',
        textPrimary: 'text-slate-100',
        textSecondary: 'text-slate-400',
        button: 'bg-amber-500 text-slate-900 hover:bg-amber-400 transition-colors rounded-sm px-8 py-4 font-semibold',
        accentColor: 'text-amber-400',
        heroGradient: 'bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent',
      };
    default:
      return {
        pageBackground: 'bg-white',
        textPrimary: 'text-stone-900',
        textSecondary: 'text-stone-500',
        headingFont: 'font-cormorant tracking-wide',
        bodyFont: 'font-manrope font-light',
        containerClasses: 'max-w-6xl mx-auto px-8 py-32',
        button: 'bg-stone-900 text-white hover:bg-stone-800 transition-colors rounded-none px-8 py-4 uppercase tracking-widest text-sm',
        productCard: 'group overflow-hidden rounded-none',
        productImageHover: 'transition-transform duration-1000 group-hover:scale-105',
        accentColor: 'text-amber-700',
        heroGradient: 'bg-gradient-to-t from-black/60 via-black/20 to-transparent',
      };
  }
}

export function getThemeStyles(theme: ThemeType, tokens?: ThemeTokenSelection | null): ThemeStyles {
  if (tokens) return composeThemeFromTokens(tokens);
  switch (theme) {
    case 'garage-industrial':
      return coreThemeStyles('brutalist');
    case 'mudroom-family':
      return coreThemeStyles('classic-warm');
    case 'commercial-pro':
      return coreThemeStyles('modern-office');
    case 'luxury-gallery':
      return coreThemeStyles('elegant-dressing');
    case 'kids-playful':
      return coreThemeStyles('playful-kids');
    case 'media-theater':
      return coreThemeStyles('sleek-entertainment');
    case 'wine-cellar':
      return coreThemeStyles('sophisticated-wine');

    // ── New trade-vertical themes ──
    // Each aliases to the closest existing "core" palette (keeping the
    // curated font/shape pairing) with a small background/accent/button
    // override so the vertical reads as its own distinct look rather than
    // an unstyled fallback.
    case 'fresh-clean':
      return {
        ...coreThemeStyles('laundry-clean'),
        pageBackground: 'bg-white',
        accentColor: 'text-sky-600',
      };
    case 'warm-handyman':
      return coreThemeStyles('classic-warm');
    case 'rich-flooring':
      return {
        ...coreThemeStyles('cozy-library'),
        pageBackground: 'bg-[#3a2e22]',
        accentColor: 'text-[#c98a4b]',
      };
    case 'artisan-wood':
      return {
        ...coreThemeStyles('rustic-pantry'),
        button: 'bg-[#7a5230] text-white hover:bg-[#5f3f24] transition-colors rounded-sm px-8 py-4 uppercase tracking-wider',
        accentColor: 'text-[#7a5230]',
      };
    case 'swift-mobile':
      return {
        ...coreThemeStyles('sleek-entertainment'),
        button: 'bg-indigo-500 text-white hover:bg-indigo-400 transition-colors rounded-none px-8 py-4 font-bold tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.4)]',
        accentColor: 'text-indigo-400',
      };
    case 'clean-move':
      return {
        ...coreThemeStyles('functional-utility'),
        accentColor: 'text-blue-600',
        button: 'bg-blue-700 text-white hover:bg-blue-800 transition-colors rounded px-6 py-3 font-medium',
      };
    case 'urban-reclaim':
      return {
        ...coreThemeStyles('garage-industrial'),
        button: 'bg-emerald-500 text-black hover:bg-emerald-400 transition-colors rounded-none px-8 py-4 uppercase font-bold text-base border-2 border-emerald-500',
        accentColor: 'text-emerald-400',
      };
    case 'stone-masonry':
      return {
        pageBackground: 'bg-stone-200',
        textPrimary: 'text-stone-900',
        textSecondary: 'text-stone-600',
        headingFont: 'font-archivo font-black tracking-tight',
        bodyFont: 'font-manrope',
        containerClasses: 'max-w-7xl mx-auto px-6 py-24',
        button: 'bg-stone-800 text-white hover:bg-stone-900 transition-colors rounded-none px-8 py-4 uppercase tracking-wider',
        productCard: 'group overflow-hidden rounded-none border border-stone-400/40 bg-stone-100',
        productImageHover: 'transition-transform duration-500 group-hover:scale-105',
        accentColor: 'text-stone-700',
        heroGradient: 'bg-gradient-to-t from-stone-950/70 via-stone-900/20 to-transparent',
      };
    case 'appliance-pro':
      return {
        ...coreThemeStyles('modern-office'),
        accentColor: 'text-slate-600',
      };
    case 'care-comfort':
      return {
        ...coreThemeStyles('playful-kids'),
        pageBackground: 'bg-rose-50',
        button: 'bg-emerald-500 text-white hover:bg-emerald-600 transition-transform hover:scale-105 rounded-full px-8 py-4 font-bold text-lg shadow-lg',
        accentColor: 'text-emerald-600',
      };

    // ── Second wave ──
    case 'pool-resort':
      return {
        ...coreThemeStyles('coastal-climate'),
        pageBackground: 'bg-cyan-50',
        button: 'bg-cyan-700 text-white hover:bg-cyan-800 transition-colors rounded-md px-8 py-4',
        accentColor: 'text-cyan-700',
      };
    case 'home-guardian':
      return coreThemeStyles('office-executive');
    case 'eco-solar':
      return {
        ...coreThemeStyles('modern-office'),
        button: 'bg-emerald-600 text-white hover:bg-emerald-700 transition-colors rounded-md px-8 py-4 font-medium',
        accentColor: 'text-emerald-600',
      };
    case 'pastoral-pet':
      return {
        ...coreThemeStyles('playful-kids'),
        pageBackground: 'bg-emerald-50',
        button: 'bg-sky-500 text-white hover:bg-sky-600 transition-transform hover:scale-105 rounded-full px-8 py-4 font-bold text-lg shadow-lg',
        accentColor: 'text-sky-600',
      };
    case 'hearth-warm':
      return {
        ...coreThemeStyles('sophisticated-wine'),
        pageBackground: 'bg-[#241a15]',
        button: 'bg-[#8c3a2a] text-[#f4e9de] hover:bg-[#712e21] transition-colors rounded-none px-10 py-4 uppercase tracking-[0.2em] border border-[#8c3a2a]',
        accentColor: 'text-[#c9704f]',
      };
    case 'seasonal-outdoor':
      return {
        ...coreThemeStyles('functional-utility'),
        button: 'bg-emerald-700 text-white hover:bg-emerald-800 transition-colors rounded px-6 py-3 font-medium',
        accentColor: 'text-emerald-700',
      };
    case 'garage-smart':
      return {
        ...coreThemeStyles('sleek-entertainment'),
        button: 'bg-blue-500 text-black hover:bg-blue-400 transition-colors rounded-none px-8 py-4 font-bold tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.4)]',
        accentColor: 'text-blue-400',
      };
    case 'window-light':
      return {
        ...coreThemeStyles('luxury-minimal'),
        pageBackground: 'bg-sky-50/40',
        accentColor: 'text-sky-700',
      };

    // ── Third wave ──
    case 'bold-remodel':
      return {
        ...coreThemeStyles('brutalist'),
        button: 'bg-orange-500 text-black hover:bg-orange-400 transition-colors rounded-none px-8 py-4 uppercase font-bold text-base border-2 border-orange-500',
        accentColor: 'text-orange-400',
      };
    case 'winter-ready':
      return {
        ...coreThemeStyles('modern-office'),
        pageBackground: 'bg-slate-100',
        button: 'bg-sky-700 text-white hover:bg-sky-800 transition-colors rounded-md px-8 py-4 font-medium',
        accentColor: 'text-sky-700',
      };
    case 'event-festive':
      return {
        ...coreThemeStyles('playful-kids'),
        button: 'bg-fuchsia-500 text-white hover:bg-fuchsia-600 transition-transform hover:scale-105 rounded-full px-8 py-4 font-bold text-lg shadow-lg',
        accentColor: 'text-fuchsia-500',
      };
    case 'wellness-calm':
      return coreThemeStyles('minimalist-zen');
    case 'fleet-logistics':
      return coreThemeStyles('office-executive');
    case 'media-creative':
      return {
        ...coreThemeStyles('sleek-entertainment'),
        button: 'bg-fuchsia-500 text-black hover:bg-fuchsia-400 transition-colors rounded-none px-8 py-4 font-bold tracking-widest shadow-[0_0_20px_rgba(217,70,239,0.4)]',
        accentColor: 'text-fuchsia-400',
      };
    case 'gourmet-warm':
      return {
        ...coreThemeStyles('classic-warm'),
        accentColor: 'text-red-800',
      };

    default:
      return coreThemeStyles(theme);
  }
}

/**
 * Seeded typographic "voice" expansion.
 *
 * getThemeStyles() returns one canonical font pairing per theme. To make two
 * sites on the SAME theme still feel individually designed, we rotate the
 * typeface — but only within a curated pool that matches the theme's mood
 * (its "voice family"). The theme keeps all its own styling modifiers
 * (weight / italic / uppercase / tracking); only the typeface token is swapped.
 *
 * Heading pools never contain a sans face for serif-led voices (and vice
 * versa), and body pools only contain text-readable faces, so every seeded
 * combination stays on-brand instead of becoming a random mismatch.
 */
type VoiceFamily = 'luxe' | 'editorial' | 'modernSans' | 'boldDisplay' | 'playful';

const THEME_VOICE: Record<ThemeType, VoiceFamily> = {
  'luxury-minimal': 'luxe',
  'brutalist': 'boldDisplay',
  'classic-warm': 'editorial',
  'modern-office': 'modernSans',
  'playful-kids': 'playful',
  'rustic-pantry': 'editorial',
  'sleek-entertainment': 'modernSans',
  'elegant-dressing': 'luxe',
  'functional-utility': 'modernSans',
  'creative-craft': 'playful',
  'sophisticated-wine': 'luxe',
  'cozy-library': 'editorial',
  'minimalist-zen': 'modernSans',
  'garage-industrial': 'boldDisplay',
  'pantry-fresh': 'editorial',
  'laundry-clean': 'modernSans',
  'mudroom-family': 'editorial',
  'commercial-pro': 'modernSans',
  'coastal-climate': 'luxe',
  'historic-classic': 'editorial',
  'luxury-gallery': 'luxe',
  'kids-playful': 'playful',
  'media-theater': 'modernSans',
  'office-executive': 'modernSans',
  'wine-cellar': 'luxe',

  // New trade-vertical themes
  'fresh-clean': 'modernSans',
  'warm-handyman': 'editorial',
  'rich-flooring': 'editorial',
  'artisan-wood': 'editorial',
  'swift-mobile': 'modernSans',
  'clean-move': 'modernSans',
  'urban-reclaim': 'boldDisplay',
  'stone-masonry': 'boldDisplay',
  'appliance-pro': 'modernSans',
  'care-comfort': 'playful',

  // Second wave
  'pool-resort': 'luxe',
  'home-guardian': 'modernSans',
  'eco-solar': 'modernSans',
  'pastoral-pet': 'playful',
  'hearth-warm': 'editorial',
  'seasonal-outdoor': 'modernSans',
  'garage-smart': 'modernSans',
  'window-light': 'luxe',

  // Third wave
  'bold-remodel': 'boldDisplay',
  'winter-ready': 'modernSans',
  'event-festive': 'playful',
  'wellness-calm': 'modernSans',
  'fleet-logistics': 'modernSans',
  'media-creative': 'modernSans',
  'gourmet-warm': 'editorial',
};

// Interchangeable heading typefaces per voice family (all carry the same mood).
const HEADING_VOICE: Record<VoiceFamily, string[]> = {
  luxe: ['font-cormorant', 'font-playfair', 'font-fraunces', 'font-dm-serif'],
  editorial: ['font-dm-serif', 'font-fraunces', 'font-playfair', 'font-lora', 'font-libre-baskerville'],
  modernSans: ['font-space-grotesk', 'font-archivo', 'font-manrope', 'font-syne'],
  boldDisplay: ['font-archivo', 'font-syne', 'font-space-grotesk'],
  playful: ['font-syne', 'font-fraunces', 'font-archivo', 'font-space-grotesk'],
};

// Body typefaces per voice family — only text-readable faces (no display serifs).
const BODY_VOICE: Record<VoiceFamily, string[]> = {
  luxe: ['font-manrope', 'font-lora', 'font-libre-baskerville'],
  editorial: ['font-lora', 'font-libre-baskerville'],
  modernSans: ['font-manrope', 'font-inter'],
  boldDisplay: ['font-space-grotesk', 'font-inter', 'font-manrope'],
  playful: ['font-manrope', 'font-space-grotesk'],
};

// Matches exactly one typeface utility token (longer multi-word names first so
// e.g. `font-dm-serif` is not partially matched by a bare `serif`). Weight
// utilities like `font-bold` / `font-black` are deliberately NOT in this list,
// so they survive the swap.
const TYPEFACE_RE =
  /font-(?:libre-baskerville|space-grotesk|dm-serif|cormorant|playfair|fraunces|archivo|manrope|syne|inter|lora|sans|serif)(?![a-z-])/;

/**
 * Returns a copy of `styles` with its heading/body typeface rotated to a
 * seed-stable pick from the theme's voice family. Same seed → same fonts every
 * render (deterministic), so SSR and client agree and a given site is stable.
 */
export function applyFontVoice(styles: ThemeStyles, theme: ThemeType, seed: string): ThemeStyles {
  if (!seed) return styles;
  const family = THEME_VOICE[theme] ?? 'luxe';
  const heads = HEADING_VOICE[family];
  const bodies = BODY_VOICE[family];
  const head = heads[hashSeed(`${seed}:voice-head`) % heads.length];
  const body = bodies[hashSeed(`${seed}:voice-body`) % bodies.length];
  return {
    ...styles,
    headingFont: styles.headingFont.replace(TYPEFACE_RE, head),
    bodyFont: styles.bodyFont.replace(TYPEFACE_RE, body),
  };
}

/**
 * Seeded accent "color voice".
 *
 * Each accent swatch is a hand-curated, internally consistent unit: a readable
 * accent-as-text token for light page backgrounds (`textLight`) and for dark
 * ones (`textDark`), a solid accent fill (`bg`), the text color that stays
 * readable on that fill (`on`), and the matching hex (for the widget preview).
 * Because each swatch is complete, every seeded pick is guaranteed readable —
 * we never mix a light fill with white text.
 *
 * Each theme exposes a small pool of swatches chosen to suit its mood/palette,
 * so rotating stays on-brand (a corporate theme rotates among blues/teals, a
 * wine theme among deep reds, etc.) instead of becoming a random hue.
 *
 * NOTE: every token below is a literal string so Tailwind's scanner emits the
 * class. Do not build these dynamically.
 */
interface AccentSwatch {
  textLight: string;
  textDark: string;
  bg: string;
  on: string;
  hex: string;
}

const SWATCH: Record<string, AccentSwatch> = {
  amber:   { textLight: 'text-amber-700',   textDark: 'text-amber-300',   bg: 'bg-amber-600',   on: 'text-white',      hex: '#b45309' },
  gold:    { textLight: 'text-yellow-700',  textDark: 'text-yellow-300',  bg: 'bg-yellow-500',  on: 'text-black',      hex: '#ca8a04' },
  copper:  { textLight: 'text-orange-700',  textDark: 'text-orange-300',  bg: 'bg-orange-700',  on: 'text-white',      hex: '#c2410c' },
  bronze:  { textLight: 'text-amber-800',   textDark: 'text-amber-200',   bg: 'bg-amber-800',   on: 'text-white',      hex: '#92400e' },
  blue:    { textLight: 'text-blue-600',    textDark: 'text-blue-300',    bg: 'bg-blue-600',    on: 'text-white',      hex: '#2563eb' },
  indigo:  { textLight: 'text-indigo-600',  textDark: 'text-indigo-300',  bg: 'bg-indigo-600',  on: 'text-white',      hex: '#4f46e5' },
  teal:    { textLight: 'text-teal-700',    textDark: 'text-teal-300',    bg: 'bg-teal-600',    on: 'text-white',      hex: '#0d9488' },
  cyan:    { textLight: 'text-cyan-600',    textDark: 'text-cyan-300',    bg: 'bg-cyan-500',    on: 'text-black',      hex: '#06b6d4' },
  sky:     { textLight: 'text-sky-600',     textDark: 'text-sky-300',     bg: 'bg-sky-600',     on: 'text-white',      hex: '#0284c7' },
  emerald: { textLight: 'text-emerald-700', textDark: 'text-emerald-300', bg: 'bg-emerald-600', on: 'text-white',      hex: '#059669' },
  green:   { textLight: 'text-green-700',   textDark: 'text-green-300',   bg: 'bg-green-700',   on: 'text-white',      hex: '#15803d' },
  rose:    { textLight: 'text-rose-600',    textDark: 'text-rose-300',    bg: 'bg-rose-500',    on: 'text-white',      hex: '#f43f5e' },
  red:     { textLight: 'text-red-700',     textDark: 'text-red-300',     bg: 'bg-red-700',     on: 'text-white',      hex: '#b91c1c' },
  wine:    { textLight: 'text-rose-800',    textDark: 'text-[#c97a83]',   bg: 'bg-[#5c1c24]',   on: 'text-[#e6d5cc]',  hex: '#8c2a35' },
  purple:  { textLight: 'text-purple-600',  textDark: 'text-purple-300',  bg: 'bg-purple-600',  on: 'text-white',      hex: '#9333ea' },
  violet:  { textLight: 'text-violet-600',  textDark: 'text-violet-300',  bg: 'bg-violet-600',  on: 'text-white',      hex: '#7c3aed' },
  fuchsia: { textLight: 'text-fuchsia-600', textDark: 'text-fuchsia-300', bg: 'bg-fuchsia-500', on: 'text-white',      hex: '#d946ef' },
  slate:   { textLight: 'text-slate-600',   textDark: 'text-slate-300',   bg: 'bg-slate-700',   on: 'text-white',      hex: '#475569' },
  zen:     { textLight: 'text-[#7d8276]',   textDark: 'text-[#aeb3a6]',   bg: 'bg-[#5b6157]',   on: 'text-white',      hex: '#7d8276' },
};

const THEME_ACCENTS: Record<ThemeType, string[]> = {
  'luxury-minimal':      ['amber', 'bronze', 'copper', 'slate'],
  'brutalist':           ['gold', 'cyan', 'rose'],
  'classic-warm':        ['bronze', 'amber', 'copper', 'red'],
  'modern-office':       ['blue', 'indigo', 'teal', 'sky'],
  'playful-kids':        ['rose', 'sky', 'violet', 'emerald'],
  'rustic-pantry':       ['green', 'emerald', 'bronze'],
  'sleek-entertainment': ['cyan', 'fuchsia', 'sky'],
  'elegant-dressing':    ['gold', 'amber', 'bronze', 'rose'],
  'functional-utility':  ['blue', 'slate', 'teal'],
  'creative-craft':      ['purple', 'violet', 'fuchsia', 'indigo'],
  'sophisticated-wine':  ['wine', 'red', 'bronze'],
  'cozy-library':        ['copper', 'bronze', 'amber'],
  'minimalist-zen':      ['zen', 'slate', 'teal'],
  'garage-industrial':   ['gold', 'cyan', 'red'],
  'pantry-fresh':        ['emerald', 'green', 'teal'],
  'laundry-clean':       ['sky', 'blue', 'teal'],
  'mudroom-family':      ['bronze', 'amber', 'green'],
  'commercial-pro':      ['blue', 'indigo', 'slate'],
  'coastal-climate':     ['teal', 'sky', 'emerald'],
  'historic-classic':    ['bronze', 'amber', 'red'],
  'luxury-gallery':      ['gold', 'amber', 'bronze'],
  'kids-playful':        ['rose', 'sky', 'violet'],
  'media-theater':       ['cyan', 'fuchsia', 'sky'],
  'office-executive':    ['amber', 'gold', 'sky'],
  'wine-cellar':         ['wine', 'red', 'bronze'],
  // New trade-vertical themes
  'fresh-clean':         ['sky', 'blue', 'teal'],
  'warm-handyman':       ['bronze', 'amber', 'copper'],
  'rich-flooring':       ['copper', 'bronze', 'amber'],
  'artisan-wood':        ['bronze', 'amber', 'green'],
  'swift-mobile':        ['indigo', 'cyan', 'blue'],
  'clean-move':          ['blue', 'slate', 'teal'],
  'urban-reclaim':       ['green', 'gold', 'slate'],
  'stone-masonry':       ['slate', 'zen', 'bronze'],
  'appliance-pro':       ['blue', 'slate', 'teal'],
  'care-comfort':        ['emerald', 'rose', 'sky'],

  // Second wave
  'pool-resort':         ['cyan', 'teal', 'sky'],
  'home-guardian':       ['blue', 'slate', 'indigo'],
  'eco-solar':           ['emerald', 'green', 'sky'],
  'pastoral-pet':        ['sky', 'emerald', 'rose'],
  'hearth-warm':         ['copper', 'red', 'amber'],
  'seasonal-outdoor':    ['emerald', 'green', 'teal'],
  'garage-smart':        ['blue', 'cyan', 'indigo'],
  'window-light':        ['sky', 'amber', 'slate'],

  // Third wave
  'bold-remodel':        ['gold', 'red', 'cyan'],
  'winter-ready':        ['sky', 'blue', 'slate'],
  'event-festive':       ['fuchsia', 'rose', 'violet'],
  'wellness-calm':       ['zen', 'teal', 'sky'],
  'fleet-logistics':     ['blue', 'indigo', 'slate'],
  'media-creative':      ['fuchsia', 'cyan', 'purple'],
  'gourmet-warm':        ['amber', 'bronze', 'red'],};

/** Seed-stable accent swatch for a theme (deterministic; null when no seed). */
function resolveAccent(theme: ThemeType, seed: string): AccentSwatch | null {
  if (!seed) return null;
  const pool = THEME_ACCENTS[theme];
  if (!pool || pool.length === 0) return null;
  const key = pool[hashSeed(`${seed}:accent`) % pool.length];
  return SWATCH[key] ?? null;
}

/**
 * Combined seeded "voice": rotates both typography (font family) and the accent
 * color, each within a curated, on-brand pool for the theme. Returns a patched
 * copy of `styles`; `getSectionTokens`/`getThemePrimaryHex` accept the same seed
 * so the accent stays consistent across every section and the quote widget.
 */
export function applyVoice(
  styles: ThemeStyles,
  theme: ThemeType,
  seed: string,
  tokens?: ThemeTokenSelection | null
): ThemeStyles {
  // A synthesized selection is already fully resolved by composeThemeFromTokens
  // (one deterministic font/accent pick) — no further seeded rotation needed.
  if (tokens) return styles;
  const withFont = applyFontVoice(styles, theme, seed);
  const accent = resolveAccent(theme, seed);
  if (!accent) return withFont;
  const isDark = SECTION_TOKENS[theme]?.isDark ?? false;
  return {
    ...withFont,
    accentColor: isDark ? accent.textDark : accent.textLight,
  };
}

/**
 * Assembles a full ThemeStyles from a synthesized token selection, using only
 * pre-authored literal Tailwind classes from SURFACE_POOL / SHAPE_POOL /
 * SWATCH / HEADING_VOICE / BODY_VOICE. Used as a last-resort alternative to
 * the ~47 hand-authored themes above when a business's industry/services
 * don't confidently fit any curated theme pool.
 */
export function composeThemeFromTokens(tokens: ThemeTokenSelection): ThemeStyles {
  const surface = SURFACE_POOL[tokens.surface] ?? SURFACE_POOL['warm-light'];
  const shape = SHAPE_POOL[tokens.shape] ?? SHAPE_POOL['soft-modern'];
  const swatch = SWATCH[tokens.swatch] ?? SWATCH['slate'];
  const family: VoiceFamily = (tokens.voice in HEADING_VOICE ? tokens.voice : 'modernSans') as VoiceFamily;
  const heading = HEADING_VOICE[family][0];
  const body = BODY_VOICE[family][0];
  return {
    pageBackground: surface.pageBackground,
    textPrimary: surface.textPrimary,
    textSecondary: surface.textSecondary,
    headingFont: `${heading} ${shape.headingModifier}`.trim(),
    bodyFont: `${body} ${shape.bodyModifier}`.trim(),
    containerClasses: shape.containerClasses,
    button: `${swatch.bg} ${swatch.on} hover:opacity-90 transition-opacity ${shape.buttonShape}`,
    productCard: shape.productCard,
    productImageHover: shape.productImageHover,
    accentColor: surface.isDark ? swatch.textDark : swatch.textLight,
    heroGradient: surface.heroGradient,
  };
}

/**
 * A site's full design fingerprint within a theme: structural composition +
 * typographic voice + accent color, as a single stable string. Two sites with
 * the same theme AND the same fingerprint would render as visually identical
 * "designs" — so the provisioner probes this (mirrored in closet-dashboard) to
 * guarantee every new site is bespoke. Theme is intentionally excluded from the
 * string because uniqueness is enforced per-theme (the probe partitions by it).
 */
export function designFingerprint(theme: ThemeType, seed: string): string {
  const struct = structuralFingerprint(seed, theme);
  const family = THEME_VOICE[theme] ?? 'luxe';
  const head = hashSeed(`${seed}:voice-head`) % HEADING_VOICE[family].length;
  const body = hashSeed(`${seed}:voice-body`) % BODY_VOICE[family].length;
  const pool = THEME_ACCENTS[theme] ?? [];
  const accent = pool.length ? hashSeed(`${seed}:accent`) % pool.length : 0;
  return `${struct}.h${head}.b${body}.a${accent}`;
}

/**
 * Complementary, section-level tokens consumed by ProcessSection, QuizSection,
 * BeforeAfterSlider and ProductDetailSheet. Kept here (alongside getThemeStyles)
 * so adding/adjusting a theme is a single-file change and every section
 * component renders correctly for all 13 themes instead of falling back to the
 * luxury-minimal palette.
 */
export interface SectionTokens {
  isDark: boolean;
  surface: string;        // elevated card/panel background
  surfaceBorder: string;  // border for surfaces/cards
  accent: string;         // accent text color
  accentBg: string;       // solid accent fill (selected states, slider line/handle)
  accentText: string;     // readable text color on top of accentBg
}

const SECTION_TOKENS: Record<ThemeType, SectionTokens> = {
  'luxury-minimal':      { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-stone-200',       accent: 'text-amber-700',  accentBg: 'bg-stone-900',  accentText: 'text-white' },
  'brutalist':           { isDark: true,  surface: 'bg-white/[0.03]',     surfaceBorder: 'border-white/15',        accent: 'text-yellow-400', accentBg: 'bg-yellow-400', accentText: 'text-black' },
  'classic-warm':        { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-amber-900/10',    accent: 'text-amber-800',  accentBg: 'bg-amber-900',  accentText: 'text-white' },
  'modern-office':       { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-slate-200',       accent: 'text-blue-600',   accentBg: 'bg-blue-600',   accentText: 'text-white' },
  'playful-kids':        { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-rose-200',        accent: 'text-rose-500',   accentBg: 'bg-rose-500',   accentText: 'text-white' },
  'rustic-pantry':       { isDark: false, surface: 'bg-[#ece8df]',        surfaceBorder: 'border-[#515c4a]/20',    accent: 'text-[#515c4a]',  accentBg: 'bg-[#515c4a]',  accentText: 'text-white' },
  'sleek-entertainment': { isDark: true,  surface: 'bg-zinc-900',         surfaceBorder: 'border-zinc-800',        accent: 'text-cyan-400',   accentBg: 'bg-cyan-500',   accentText: 'text-black' },
  'elegant-dressing':    { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-[#d4af37]/30',    accent: 'text-[#d4af37]',  accentBg: 'bg-[#d4af37]',  accentText: 'text-white' },
  'functional-utility':  { isDark: false, surface: 'bg-neutral-50',       surfaceBorder: 'border-neutral-200',     accent: 'text-blue-500',   accentBg: 'bg-neutral-900', accentText: 'text-white' },
  'creative-craft':      { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-purple-100',      accent: 'text-purple-600', accentBg: 'bg-purple-600', accentText: 'text-white' },
  'sophisticated-wine':  { isDark: true,  surface: 'bg-[#24181a]',        surfaceBorder: 'border-[#362427]',       accent: 'text-[#8c2a35]',  accentBg: 'bg-[#5c1c24]',  accentText: 'text-[#e6d5cc]' },
  'cozy-library':        { isDark: true,  surface: 'bg-[#362c22]',        surfaceBorder: 'border-[#4a3d2f]',       accent: 'text-[#d2a679]',  accentBg: 'bg-[#8b5a2b]',  accentText: 'text-[#f4efe8]' },
  'minimalist-zen':      { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-[#2a2b2a]/15',    accent: 'text-[#7d8276]',  accentBg: 'bg-[#2a2b2a]',  accentText: 'text-white' },
  'garage-industrial':   { isDark: true,  surface: 'bg-white/[0.03]',     surfaceBorder: 'border-white/15',        accent: 'text-yellow-400', accentBg: 'bg-yellow-400', accentText: 'text-black' },
  'pantry-fresh':        { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-emerald-200',     accent: 'text-emerald-800', accentBg: 'bg-emerald-800', accentText: 'text-white' },
  'laundry-clean':       { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-sky-200',         accent: 'text-sky-600',    accentBg: 'bg-sky-600',    accentText: 'text-white' },
  'mudroom-family':      { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-amber-900/10',    accent: 'text-amber-800',  accentBg: 'bg-amber-900',  accentText: 'text-white' },
  'commercial-pro':      { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-slate-200',       accent: 'text-blue-600',   accentBg: 'bg-blue-600',   accentText: 'text-white' },
  'coastal-climate':     { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-teal-200',        accent: 'text-teal-700',   accentBg: 'bg-teal-700',   accentText: 'text-white' },
  'historic-classic':    { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-amber-900/10',    accent: 'text-amber-800',  accentBg: 'bg-amber-900',  accentText: 'text-white' },
  'luxury-gallery':      { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-[#d4af37]/30',    accent: 'text-[#d4af37]',  accentBg: 'bg-[#d4af37]',  accentText: 'text-white' },
  'kids-playful':        { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-rose-200',        accent: 'text-rose-500',   accentBg: 'bg-rose-500',   accentText: 'text-white' },
  'media-theater':       { isDark: true,  surface: 'bg-zinc-900',         surfaceBorder: 'border-zinc-800',        accent: 'text-cyan-400',   accentBg: 'bg-cyan-500',   accentText: 'text-black' },
  'office-executive':    { isDark: true,  surface: 'bg-slate-800',        surfaceBorder: 'border-slate-700',       accent: 'text-amber-400',  accentBg: 'bg-amber-500',  accentText: 'text-slate-900' },
  'wine-cellar':         { isDark: true,  surface: 'bg-[#24181a]',        surfaceBorder: 'border-[#362427]',       accent: 'text-[#8c2a35]',  accentBg: 'bg-[#5c1c24]',  accentText: 'text-[#e6d5cc]' },

  // New trade-vertical themes
  'fresh-clean':         { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-sky-200',         accent: 'text-sky-600',    accentBg: 'bg-sky-600',    accentText: 'text-white' },
  'warm-handyman':       { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-amber-900/10',    accent: 'text-amber-800',  accentBg: 'bg-amber-900',  accentText: 'text-white' },
  'rich-flooring':       { isDark: true,  surface: 'bg-[#4a3b2c]',        surfaceBorder: 'border-[#5f4c39]',       accent: 'text-[#c98a4b]',  accentBg: 'bg-[#c98a4b]',  accentText: 'text-[#2c2318]' },
  'artisan-wood':        { isDark: false, surface: 'bg-[#ece8df]',        surfaceBorder: 'border-[#7a5230]/20',    accent: 'text-[#7a5230]',  accentBg: 'bg-[#7a5230]',  accentText: 'text-white' },
  'swift-mobile':        { isDark: true,  surface: 'bg-zinc-900',         surfaceBorder: 'border-zinc-800',        accent: 'text-indigo-400', accentBg: 'bg-indigo-500', accentText: 'text-white' },
  'clean-move':          { isDark: false, surface: 'bg-neutral-50',       surfaceBorder: 'border-neutral-200',     accent: 'text-blue-600',   accentBg: 'bg-blue-700',   accentText: 'text-white' },
  'urban-reclaim':       { isDark: true,  surface: 'bg-white/[0.03]',     surfaceBorder: 'border-white/15',        accent: 'text-emerald-400', accentBg: 'bg-emerald-500', accentText: 'text-black' },
  'stone-masonry':       { isDark: false, surface: 'bg-stone-100',        surfaceBorder: 'border-stone-400/40',    accent: 'text-stone-700',  accentBg: 'bg-stone-800',  accentText: 'text-white' },
  'appliance-pro':       { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-slate-200',       accent: 'text-slate-600',  accentBg: 'bg-slate-700',  accentText: 'text-white' },
  'care-comfort':        { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-rose-200',        accent: 'text-emerald-600', accentBg: 'bg-emerald-500', accentText: 'text-white' },

  // Second wave
  'pool-resort':         { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-cyan-200',        accent: 'text-cyan-700',   accentBg: 'bg-cyan-700',   accentText: 'text-white' },
  'home-guardian':       { isDark: true,  surface: 'bg-slate-800',        surfaceBorder: 'border-slate-700',       accent: 'text-amber-400',  accentBg: 'bg-amber-500',  accentText: 'text-slate-900' },
  'eco-solar':           { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-slate-200',       accent: 'text-emerald-600', accentBg: 'bg-emerald-600', accentText: 'text-white' },
  'pastoral-pet':        { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-emerald-200',     accent: 'text-sky-600',    accentBg: 'bg-sky-500',    accentText: 'text-white' },
  'hearth-warm':         { isDark: true,  surface: 'bg-[#2f2119]',        surfaceBorder: 'border-[#4a3327]',       accent: 'text-[#c9704f]',  accentBg: 'bg-[#8c3a2a]',  accentText: 'text-[#f4e9de]' },
  'seasonal-outdoor':    { isDark: false, surface: 'bg-neutral-50',       surfaceBorder: 'border-neutral-200',     accent: 'text-emerald-700', accentBg: 'bg-emerald-700', accentText: 'text-white' },
  'garage-smart':        { isDark: true,  surface: 'bg-zinc-900',         surfaceBorder: 'border-zinc-800',        accent: 'text-blue-400',   accentBg: 'bg-blue-500',   accentText: 'text-black' },
  'window-light':        { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-stone-200',       accent: 'text-sky-700',    accentBg: 'bg-sky-700',    accentText: 'text-white' },

  // Third wave
  'bold-remodel':        { isDark: true,  surface: 'bg-white/[0.03]',     surfaceBorder: 'border-white/15',        accent: 'text-orange-400', accentBg: 'bg-orange-500', accentText: 'text-black' },
  'winter-ready':         { isDark: false, surface: 'bg-white',           surfaceBorder: 'border-slate-200',       accent: 'text-sky-700',    accentBg: 'bg-sky-700',    accentText: 'text-white' },
  'event-festive':       { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-rose-200',        accent: 'text-fuchsia-500', accentBg: 'bg-fuchsia-500', accentText: 'text-white' },
  'wellness-calm':       { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-[#2a2b2a]/15',    accent: 'text-[#7d8276]',  accentBg: 'bg-[#2a2b2a]',  accentText: 'text-white' },
  'fleet-logistics':     { isDark: true,  surface: 'bg-slate-800',        surfaceBorder: 'border-slate-700',       accent: 'text-amber-400',  accentBg: 'bg-amber-500',  accentText: 'text-slate-900' },
  'media-creative':      { isDark: true,  surface: 'bg-zinc-900',         surfaceBorder: 'border-zinc-800',        accent: 'text-fuchsia-400', accentBg: 'bg-fuchsia-500', accentText: 'text-black' },
  'gourmet-warm':        { isDark: false, surface: 'bg-white',            surfaceBorder: 'border-amber-900/10',    accent: 'text-red-800',    accentBg: 'bg-red-800',    accentText: 'text-white' },
};

export function getSectionTokens(theme: ThemeType, seed = '', tokens?: ThemeTokenSelection | null): SectionTokens {
  if (tokens) {
    const surface = SURFACE_POOL[tokens.surface] ?? SURFACE_POOL['warm-light'];
    const swatch = SWATCH[tokens.swatch] ?? SWATCH['slate'];
    return {
      isDark: surface.isDark,
      surface: surface.surfaceClasses,
      surfaceBorder: surface.surfaceBorderClasses,
      accent: surface.isDark ? swatch.textDark : swatch.textLight,
      accentBg: swatch.bg,
      accentText: swatch.on,
    };
  }
  const base = SECTION_TOKENS[theme] || SECTION_TOKENS['luxury-minimal'];
  const accent = resolveAccent(theme, seed);
  if (!accent) return base;
  // Override only the accent trio; surfaces/borders/isDark stay theme-native.
  return {
    ...base,
    accent: base.isDark ? accent.textDark : accent.textLight,
    accentBg: accent.bg,
    accentText: accent.on,
  };
}

export function getGridClasses(count: number) {
  if (count === 1) {
    return "grid grid-cols-1 max-w-xl mx-auto gap-8";
  }
  if (count === 2) {
    return "grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8";
  }
  if (count === 4) {
    return "grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8";
  }
  if (count % 3 === 0) {
    return "grid grid-cols-1 md:grid-cols-3 gap-8";
  }
  return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8";
}

export function getThemePrimaryHex(theme: ThemeType, seed = '', tokens?: ThemeTokenSelection | null): string {
  if (tokens) return (SWATCH[tokens.swatch] ?? SWATCH['slate']).hex;
  const accent = resolveAccent(theme, seed);
  if (accent) return accent.hex;
  switch (theme) {
    case 'luxury-minimal':
      return '#b45309';
    case 'brutalist':
    case 'garage-industrial':
      return '#facc15';
    case 'classic-warm':
    case 'mudroom-family':
    case 'historic-classic':
      return '#92400e';
    case 'modern-office':
    case 'commercial-pro':
      return '#2563eb';
    case 'playful-kids':
    case 'kids-playful':
      return '#f43f5e';
    case 'rustic-pantry':
      return '#515c4a';
    case 'sleek-entertainment':
    case 'media-theater':
      return '#06b6d4';
    case 'elegant-dressing':
    case 'luxury-gallery':
      return '#d4af37';
    case 'functional-utility':
      return '#3b82f6';
    case 'creative-craft':
      return '#9333ea';
    case 'sophisticated-wine':
    case 'wine-cellar':
      return '#8c2a35';
    case 'cozy-library':
      return '#d2a679';
    case 'minimalist-zen':
      return '#7d8276';
    case 'pantry-fresh':
      return '#065f46';
    case 'laundry-clean':
      return '#0284c7';
    case 'coastal-climate':
      return '#0f766e';
    case 'office-executive':
      return '#fbbf24';
    default:
      return '#2d2d2d';
  }
}
