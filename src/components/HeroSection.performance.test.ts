import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('HeroSection LCP image delivery', () => {
  it('eager-loads every high-priority hero image', () => {
    const source = readFileSync(new URL('./HeroSection.tsx', import.meta.url), 'utf8')
    const highPriorityImages = source.match(/<Image[^>]*fetchPriority="high"[^>]*\/>/g) || []

    expect(highPriorityImages.length).toBeGreaterThan(0)
    for (const image of highPriorityImages) {
      expect(image).toContain('loading="eager"')
    }
  })
})
