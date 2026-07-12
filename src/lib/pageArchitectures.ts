import { hashSeed } from '@/lib/designVariants'

export type PageArchitecture =
  | 'quote_trust'
  | 'order_menu'
  | 'booking_schedule'
  | 'portfolio_first'
  | 'ticket_event'

export type SectionKey =
  | 'hero'
  | 'about'
  | 'process'
  | 'beforeAfter'
  | 'portfolio'
  | 'quiz'
  | 'widget'

const ARCHITECTURE_SPINES: Record<PageArchitecture, SectionKey[]> = {
  quote_trust: ['hero', 'about', 'process', 'beforeAfter', 'portfolio', 'quiz', 'widget'],
  order_menu: ['hero', 'portfolio', 'widget', 'about'],
  booking_schedule: ['hero', 'process', 'widget', 'portfolio', 'about'],
  portfolio_first: ['hero', 'portfolio', 'beforeAfter', 'about', 'widget'],
  ticket_event: ['hero', 'portfolio', 'about', 'widget'],
}

/** Layout styles that lean visual — tip quote sites toward portfolio_first. */
const VISUAL_LAYOUTS = new Set([
  'portfolio-first',
  'gallery-showcase',
  'visual-impact',
  'before-after',
])

/**
 * Resolve the homepage architecture from engagement model + layout bias.
 * Architecture defines allowed sections + default order; layoutStyle may still
 * permute within that set in ClientPage.
 */
export function resolvePageArchitecture(opts: {
  engagementModel?: string | null
  layoutStyle?: string | null
  seed?: string | null
}): PageArchitecture {
  const engagement = (opts.engagementModel || 'quote').toLowerCase()
  if (engagement === 'order') return 'order_menu'
  if (engagement === 'booking') return 'booking_schedule'
  if (engagement === 'ticket') return 'ticket_event'

  const layout = (opts.layoutStyle || '').trim()
  if (VISUAL_LAYOUTS.has(layout)) return 'portfolio_first'

  // Seeded minority of quote sites still get portfolio_first for variety.
  const seed = (opts.seed || '').trim()
  if (seed && hashSeed(`${seed}::architecture`) % 5 === 0) return 'portfolio_first'

  return 'quote_trust'
}

export function architectureSpine(arch: PageArchitecture): SectionKey[] {
  return ARCHITECTURE_SPINES[arch]
}

/**
 * Reorder `preferred` (from layoutStyle) to only include sections allowed by
 * the architecture, preserving architecture relative order for missing ones.
 */
export function mergeLayoutWithArchitecture(
  arch: PageArchitecture,
  preferredOrder: SectionKey[]
): SectionKey[] {
  const allowed = new Set(architectureSpine(arch))
  const fromPreferred = preferredOrder.filter((k) => allowed.has(k))
  const seen = new Set(fromPreferred)
  const rest = architectureSpine(arch).filter((k) => !seen.has(k))
  return [...fromPreferred, ...rest]
}

/** Map a layoutStyle string to its preferred section key order (legacy). */
export function layoutStyleSectionOrder(style: string | null | undefined): SectionKey[] {
  switch (style) {
    case 'portfolio-first':
      return ['hero', 'portfolio', 'beforeAfter', 'about', 'process', 'quiz', 'widget']
    case 'conversion-focus':
      return ['hero', 'widget', 'beforeAfter', 'portfolio', 'about']
    case 'storyteller':
      return ['hero', 'about', 'quiz', 'portfolio', 'process', 'widget', 'beforeAfter']
    case 'minimalist-lead':
    case 'compact-quote':
      return ['hero', 'quiz', 'widget']
    case 'visual-impact':
      return ['hero', 'beforeAfter', 'portfolio', 'widget']
    case 'trust-builder':
      return ['hero', 'about', 'process', 'beforeAfter', 'portfolio', 'quiz', 'widget']
    case 'gallery-showcase':
      return ['hero', 'portfolio', 'beforeAfter', 'about', 'quiz', 'widget']
    case 'local-expert':
      return ['hero', 'about', 'process', 'portfolio', 'beforeAfter', 'quiz', 'widget']
    case 'emergency-first':
      return ['hero', 'widget', 'about', 'beforeAfter', 'portfolio']
    case 'before-after':
      return ['hero', 'beforeAfter', 'portfolio', 'about', 'quiz', 'widget']
    case 'process-steps':
      return ['hero', 'process', 'about', 'portfolio', 'quiz', 'widget']
    case 'seasonal-cta':
      return ['hero', 'widget', 'portfolio', 'about', 'process']
    case 'trust-report':
      return ['hero', 'about', 'process', 'portfolio', 'beforeAfter', 'quiz', 'widget']
    case 'service-zones':
      return ['hero', 'about', 'portfolio', 'quiz', 'widget']
    case 'event-booking':
      return ['hero', 'portfolio', 'about', 'quiz', 'widget']
    case 'standard':
    default:
      return ['hero', 'about', 'process', 'beforeAfter', 'portfolio', 'quiz', 'widget']
  }
}
