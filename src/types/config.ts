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
  | 'wine-cellar';

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
    backgroundImage: string;
  };
  about: {
    description: string;
  };
  process: ProcessConfig;
  products: Product[];
  seo: SEOConfig;
  beforeAfter: BeforeAfterConfig;
  widgetId: string;
  defaultRoom?: string;
  siteStatus?: string;
  layoutStyle?: string;
  navLinks?: NavLink[];
  pagesConfig?: PageConfig[];
  // Prospect-supplied logo (shown in the header/nav instead of the text brand
  // name) and free-text pricing guidance (shown near the quote CTA).
  logoUrl?: string;
  pricingNotes?: string;
}
