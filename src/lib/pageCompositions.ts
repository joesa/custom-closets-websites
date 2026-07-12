import { hashSeed } from '@/lib/designVariants'

export type PageFamily = 'services' | 'gallery' | 'about' | 'contact' | 'default'

export type PageComposition = {
  family: PageFamily
  /** Outer content shell classes (below the hero). */
  shellClass: string
  /** Intro / sticky column for services. */
  servicesIntroSticky: boolean
  /** Gallery prefers full-bleed masonry feel. */
  galleryBleed: boolean
  /** About uses statement + credentials two-column when possible. */
  aboutSplit: boolean
  /** Contact uses split CTA band. */
  contactSplit: boolean
}

const FAMILY_ALIASES: Record<string, PageFamily> = {
  services: 'services',
  service: 'services',
  offerings: 'services',
  menu: 'services',
  gallery: 'gallery',
  portfolio: 'gallery',
  projects: 'gallery',
  work: 'gallery',
  about: 'about',
  story: 'about',
  team: 'about',
  contact: 'contact',
  book: 'contact',
  booking: 'contact',
}

export function resolvePageFamily(slug: string): PageFamily {
  const key = slug.replace(/^\//, '').toLowerCase().split(/[-_/]/)[0] || 'default'
  return FAMILY_ALIASES[key] || 'default'
}

/**
 * Seeded wrapper layout for subpages. Prefers existing content_blocks;
 * composition only changes shell / grid / sticky behavior.
 */
export function resolvePageComposition(slug: string, seed?: string | null): PageComposition {
  const family = resolvePageFamily(slug)
  const h = hashSeed(`${seed || 'site'}::page::${family}`)
  const servicesSticky = family === 'services' && h % 2 === 0
  const galleryBleed = family === 'gallery'
  const aboutSplit = family === 'about'
  const contactSplit = family === 'contact'

  const shellByFamily: Record<PageFamily, string> = {
    services: servicesSticky
      ? 'py-20 px-6 mx-auto max-w-screen-xl'
      : 'py-24 px-6 mx-auto max-w-screen-xl flex flex-col gap-24',
    gallery: 'py-16 md:py-20 px-4 md:px-6 mx-auto max-w-[1400px] flex flex-col gap-16',
    about: 'py-24 px-6 mx-auto max-w-screen-lg flex flex-col gap-20',
    contact: 'py-20 px-6 mx-auto max-w-screen-xl flex flex-col gap-16',
    default: 'py-24 px-6 mx-auto max-w-screen-xl flex flex-col gap-24',
  }

  return {
    family,
    shellClass: shellByFamily[family],
    servicesIntroSticky: servicesSticky,
    galleryBleed,
    aboutSplit,
    contactSplit,
  }
}
