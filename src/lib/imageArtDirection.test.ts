import { describe, expect, it } from 'vitest'
import { resolveImageArtDirection } from './imageArtDirection'

describe('resolveImageArtDirection', () => {
  it('is stable for the same site and theme', () => {
    expect(resolveImageArtDirection('classic-warm', 'tenant-a')).toBe(
      resolveImageArtDirection('classic-warm', 'tenant-a'),
    )
  })

  it('keeps clinical themes out of warm-film grading', () => {
    const values = Array.from({ length: 20 }, (_, index) =>
      resolveImageArtDirection('care-comfort', `tenant-${index}`),
    )
    expect(values).not.toContain('warm-film')
  })
})
