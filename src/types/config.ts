export type ThemeType =
  | 'luxury-minimal'
  | 'brutalist'
  | 'classic-warm'
  | 'modern-office'
  | 'playful-kids'
  | 'rustic-pantry'
  | 'sleek-entertainment'
  | 'elegant-dressing'
  | 'functional-utility'
  | 'creative-craft'
  | 'sophisticated-wine'
  | 'cozy-library'
  | 'minimalist-zen'
  | 'garage-industrial'
  | 'pantry-fresh'
  | 'laundry-clean'
  | 'mudroom-family'
  | 'commercial-pro'
  | 'coastal-climate'
  | 'historic-classic'
  | 'luxury-gallery'
  | 'kids-playful'
  | 'media-theater'
  | 'office-executive'
  | 'wine-cellar'
  // New trade-vertical themes
  | 'fresh-clean'
  | 'warm-handyman'
  | 'rich-flooring'
  | 'artisan-wood'
  | 'swift-mobile'
  | 'clean-move'
  | 'urban-reclaim'
  | 'stone-masonry'
  | 'appliance-pro'
  | 'care-comfort'
  // Second wave — new verticals
  | 'pool-resort'
  | 'home-guardian'
  | 'eco-solar'
  | 'pastoral-pet'
  | 'hearth-warm'
  | 'seasonal-outdoor'
  | 'garage-smart'
  | 'window-light'
  // Third wave — new verticals
  | 'bold-remodel'
  | 'winter-ready'
  | 'event-festive'
  | 'wellness-calm'
  | 'fleet-logistics'
  | 'media-creative'
  | 'gourmet-warm';

export interface ProductDetails {
  subtitle: string;
  longDescription: string;
  specifications: string[];
}

export interface Product {
  title: string;
  image: string;
  description: string;
  details?: ProductDetails;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface ProcessConfig {
  title: string;
  subtitle: string;
  steps: ProcessStep[];
}

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizQuestionConfig {
  id: string;
  title: string;
  options: QuizOption[];
}

export interface QuizConfig {
  eyebrow?: string;
  headline?: string;
  questions: QuizQuestionConfig[];
}

export interface SocialProofTestimonial {
  quote: string;
  name: string;
  role?: string;
}

export interface SocialProofStat {
  value: string;
  label: string;
}

export interface SocialProofConfig {
  eyebrow?: string;
  headline?: string;
  testimonials?: SocialProofTestimonial[];
  stats?: SocialProofStat[];
}

export interface SEOConfig {
  legalName: string;
  email?: string;
  phone: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  geo: {
    latitude: string;
    longitude: string;
  };
  /** Optional homepage social proof (stored in seo_config JSONB). */
  socialProof?: SocialProofConfig;
}

export interface BeforeAfterConfig {
  beforeImage: string;
  afterImage: string;
  title: string;
  subtitle: string;
}

export interface NavLink {
  label: string;
  slug: string;
}

export interface ContentBlock {
  type: 'text' | 'image_left' | 'image_right' | 'grid' | 'gallery';
  heading: string;
  body: string;
  image?: string;
  images?: string[];
  items?: Array<{ title: string; description: string; image?: string }>;
}

export interface PageConfig {
  slug: string;
  title: string;
  is_active?: boolean;
  hero: {
    headline: string;
    backgroundImage?: string;
    subheadline?: string;
  };
  content_blocks: ContentBlock[];
}

export interface BrandConfig {
  brandName: string;
  theme: ThemeType;
  hero: {
    headline: string;
    subheadline?: string;
    backgroundImage: string;
  };
  about: {
    description: string;
  };
  process: ProcessConfig;
  products: Product[];
  seo: SEOConfig;
  beforeAfter?: BeforeAfterConfig;
  widgetId: string;
  defaultRoom?: string;
  siteStatus?: string;
  /** Agentic site-validation gate result (see siteGate.ts) — 'failed' forces
   *  the holding page regardless of siteStatus, as a defense-in-depth safety
   *  net against an approved-but-broken site becoming publicly visible. */
  validationStatus?: string;
  /** Intake pay-to-launch URL while site_status is awaiting_launch_payment */
  launchPayUrl?: string;
  layoutStyle?: string;
  /**
   * Deterministic quote-vs-order detection, resolved once at provisioning
   * time from the business's industry (see EngagementModel in
   * closet-dashboard/src/lib/catalog/types.ts). 'quote' (default, omitted or
   * absent) = the existing rooms/services -> estimate -> lead-capture widget.
   * 'order' = a menu/catalog -> cart -> order flow (e.g. restaurants-bars) —
   * NOTE: the actual order-widget UI is not built yet (tracked separately);
   * this field is threaded through end-to-end now so it's available the
   * moment that UI ships, without another cross-repo config-plumbing pass.
   */
  engagementModel?: 'quote' | 'order' | 'booking' | 'ticket';
  navLinks?: NavLink[];
  pagesConfig?: PageConfig[];
  // Prospect-supplied logo (shown in the header/nav instead of the text brand
  // name) and free-text pricing guidance (shown near the quote CTA).
  logoUrl?: string;
  pricingNotes?: string;
  // Optional explicit design-variant seed (or variant id) controlling the
  // structural composition of the hero/sections. When absent, the renderer
  // derives a stable seed from the site identity so sites still diverge.
  designVariant?: string;
  // Optional synthesized theme token selection (see ThemeTokenSelection in
  // lib/theme.ts). When present, it takes over the visual styling normally
  // driven by `theme` — used as a last-resort alternative when no curated
  // theme confidently fits the business's industry/services.
  themeTokens?: import('@/lib/theme').ThemeTokenSelection;
  // Optional AI-generated "3-question quiz" content, tailored to the
  // business's actual industry/services. Falls back to QuizSection's own
  // built-in generic questions when absent (e.g. not yet regenerated).
  quiz?: QuizConfig;
  /** Optional social proof (testimonials + stats) for homepage conviction. */
  socialProof?: SocialProofConfig;
  /** Per-site designer signature (process name, motif, eyebrow). */
  signature?: {
    processName?: string;
    motif?:
      | 'line'
      | 'dot'
      | 'bar'
      | 'double'
      | 'corner-brackets'
      | 'rule-stack'
      | 'seal'
      | 'ribbon';
    eyebrow?: string;
  } | null;
  /**
   * When 'custom', the public renderer bypasses the shared template engine and
   * paints `customConfig` (raw HTML/CSS) for this tenant only. Default/absent
   * = 'engine' — every other site is unaffected.
   */
  renderMode?: 'engine' | 'custom';
  /** Published custom-site artifact (live when renderMode = 'custom'). */
  customConfig?: import('@/lib/customSite').CustomSiteConfig | null;
  /** Draft artifact for admin preview (?draft=1 + admin_bypass). */
  customConfigDraft?: import('@/lib/customSite').CustomSiteConfig | null;
}
