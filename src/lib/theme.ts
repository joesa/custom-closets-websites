import { ThemeType } from '@/types/config';

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

function coreThemeStyles(theme: ThemeType): ThemeStyles {
  switch (theme) {
    case 'luxury-minimal':
      return {
        pageBackground: 'bg-white',
        textPrimary: 'text-stone-900',
        textSecondary: 'text-stone-500',
        headingFont: 'font-playfair tracking-wide',
        bodyFont: 'font-sans font-light',
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
        headingFont: 'font-inter font-black tracking-tighter uppercase',
        bodyFont: 'font-inter',
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
        headingFont: 'font-lora',
        bodyFont: 'font-sans',
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
        headingFont: 'font-sans font-bold tracking-tight',
        bodyFont: 'font-sans',
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
        headingFont: 'font-sans font-black tracking-tight',
        bodyFont: 'font-sans',
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
        headingFont: 'font-serif font-bold',
        bodyFont: 'font-serif',
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
        headingFont: 'font-sans font-extrabold uppercase tracking-widest',
        bodyFont: 'font-sans',
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
        headingFont: 'font-playfair font-medium italic',
        bodyFont: 'font-sans font-light',
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
        headingFont: 'font-sans font-semibold tracking-tight',
        bodyFont: 'font-sans',
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
        headingFont: 'font-sans font-bold',
        bodyFont: 'font-sans',
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
        headingFont: 'font-playfair tracking-wider',
        bodyFont: 'font-serif',
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
        headingFont: 'font-lora font-medium',
        bodyFont: 'font-lora',
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
        headingFont: 'font-sans font-light tracking-widest uppercase',
        bodyFont: 'font-sans font-light',
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
        headingFont: 'font-sans font-semibold tracking-tight',
        bodyFont: 'font-sans',
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
        headingFont: 'font-playfair tracking-wide',
        bodyFont: 'font-sans font-light',
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
        headingFont: 'font-playfair tracking-wide',
        bodyFont: 'font-sans font-light',
        containerClasses: 'max-w-6xl mx-auto px-8 py-32',
        button: 'bg-stone-900 text-white hover:bg-stone-800 transition-colors rounded-none px-8 py-4 uppercase tracking-widest text-sm',
        productCard: 'group overflow-hidden rounded-none',
        productImageHover: 'transition-transform duration-1000 group-hover:scale-105',
        accentColor: 'text-amber-700',
        heroGradient: 'bg-gradient-to-t from-black/60 via-black/20 to-transparent',
      };
  }
}

export function getThemeStyles(theme: ThemeType): ThemeStyles {
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
    default:
      return coreThemeStyles(theme);
  }
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
};

export function getSectionTokens(theme: ThemeType): SectionTokens {
  return SECTION_TOKENS[theme] || SECTION_TOKENS['luxury-minimal'];
}
