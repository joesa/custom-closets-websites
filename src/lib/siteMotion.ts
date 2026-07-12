import type { TargetAndTransition, Transition } from 'framer-motion'
import { hashSeed } from '@/lib/designVariants'

export type MotionPersonality = 'editorial' | 'commercial' | 'luxury' | 'kinetic'

const PERSONALITIES: MotionPersonality[] = ['editorial', 'commercial', 'luxury', 'kinetic']

export type SiteMotion = {
  personality: MotionPersonality
  /** Default enter transition for section blocks. */
  section: Transition
  /** Hero headline enter. */
  hero: Transition
  /** Hero CTA / secondary. */
  heroLate: Transition
  /** Initial offset for fade-up style. */
  rise: number
  /** Stagger children delay (kinetic). */
  staggerChildren: number
}

export function getSiteMotion(seed?: string | null): SiteMotion {
  const key = (seed || '').trim()
  const personality =
    PERSONALITIES[hashSeed(`${key || 'default'}::motion`) % PERSONALITIES.length]

  switch (personality) {
    case 'commercial':
      return {
        personality,
        section: { duration: 0.45, ease: 'easeOut' },
        hero: { duration: 0.5, delay: 0.08, ease: 'easeOut' },
        heroLate: { duration: 0.45, delay: 0.2, ease: 'easeOut' },
        rise: 18,
        staggerChildren: 0.06,
      }
    case 'luxury':
      return {
        personality,
        section: { duration: 1.15, ease: [0.22, 1, 0.36, 1] },
        hero: { duration: 1.2, delay: 0.18, ease: [0.22, 1, 0.36, 1] },
        heroLate: { duration: 1.1, delay: 0.38, ease: [0.22, 1, 0.36, 1] },
        rise: 14,
        staggerChildren: 0.12,
      }
    case 'kinetic':
      return {
        personality,
        section: { duration: 0.55, ease: 'easeOut' },
        hero: { duration: 0.6, delay: 0.05, ease: 'easeOut' },
        heroLate: { duration: 0.55, delay: 0.18, ease: 'easeOut' },
        rise: 28,
        staggerChildren: 0.1,
      }
    case 'editorial':
    default:
      return {
        personality,
        section: { duration: 0.85, ease: 'easeOut' },
        hero: { duration: 1, delay: 0.2, ease: 'easeOut' },
        heroLate: { duration: 1, delay: 0.4, ease: 'easeOut' },
        rise: 30,
        staggerChildren: 0.08,
      }
  }
}

export function motionRise(
  motion: SiteMotion,
  hydrated: boolean
): false | TargetAndTransition {
  return hydrated ? { opacity: 0, y: motion.rise } : false
}
