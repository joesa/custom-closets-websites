import { hashSeed } from '@/lib/designVariants'
import type { ThemeType } from '@/types/config'

export type ImageArtDirection = 'true-color' | 'warm-film' | 'cool-editorial' | 'soft-matte' | 'high-contrast'

const THEME_DIRECTIONS: Partial<Record<ThemeType, ImageArtDirection[]>> = {
  'luxury-minimal': ['soft-matte', 'cool-editorial'],
  'classic-warm': ['warm-film', 'soft-matte'],
  'rustic-pantry': ['warm-film', 'true-color'],
  'artisan-wood': ['warm-film', 'soft-matte'],
  'minimalist-zen': ['soft-matte', 'cool-editorial'],
  'care-comfort': ['cool-editorial', 'true-color'],
  'fresh-clean': ['cool-editorial', 'true-color'],
  'brutalist': ['high-contrast', 'true-color'],
  'garage-industrial': ['high-contrast', 'cool-editorial'],
  'urban-reclaim': ['high-contrast', 'warm-film'],
  'modern-office': ['cool-editorial', 'true-color'],
  'media-creative': ['high-contrast', 'cool-editorial'],
}

const DEFAULT_DIRECTIONS: ImageArtDirection[] = [
  'true-color',
  'warm-film',
  'cool-editorial',
  'soft-matte',
]

/**
 * Select one restrained, repeatable treatment for every photograph on a site.
 * The image itself remains untouched; CSS supplies the grade and tint so media
 * stays reusable and the treatment can be changed without destructive edits.
 */
export function resolveImageArtDirection(
  theme: ThemeType,
  seed?: string | null,
): ImageArtDirection {
  const choices = THEME_DIRECTIONS[theme] || DEFAULT_DIRECTIONS
  return choices[hashSeed(`${seed || theme}::image-art-direction`) % choices.length]
}
