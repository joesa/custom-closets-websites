import { describe, it, expect } from 'vitest'
import {
  ALL_CHROME_POOL_STRINGS,
  navCtaLabel,
  heroCtaLabel,
  widgetHeading,
  widgetSubheading,
  topbarFallbackLine,
  quizFinishLine,
  servicesGridEyebrow,
} from './chromeCopy'
import {
  findAiTellPhrases,
  findPlaceholderTells,
  hasEmDashInShortCopy,
  findFormulaicTitles,
} from './humanCopyVoice'

/**
 * CI guard: every hardcoded chrome string that can render on a tenant site is
 * scanned for AI tells, placeholder tells, em dashes, and formulaic titles.
 * A banned phrase added to any pool fails the build.
 */
describe('chrome copy pools', () => {
  it('contain no AI-tell phrases', () => {
    for (const text of ALL_CHROME_POOL_STRINGS) {
      expect(findAiTellPhrases(text), `AI tell in "${text}"`).toEqual([])
    }
  })

  it('contain no placeholder tells', () => {
    for (const text of ALL_CHROME_POOL_STRINGS) {
      expect(findPlaceholderTells(text), `placeholder in "${text}"`).toEqual([])
    }
  })

  it('contain no em dashes in short copy', () => {
    for (const text of ALL_CHROME_POOL_STRINGS) {
      expect(hasEmDashInShortCopy(text), `em dash in "${text}"`).toBe(false)
    }
  })

  it('contain no formulaic generator titles', () => {
    for (const text of ALL_CHROME_POOL_STRINGS) {
      expect(findFormulaicTitles(text), `formulaic title in "${text}"`).toEqual([])
    }
  })

  it('are deterministic per seed', () => {
    expect(navCtaLabel('site-a', 'quote')).toBe(navCtaLabel('site-a', 'quote'))
    expect(widgetHeading('site-a', 'booking')).toBe(widgetHeading('site-a', 'booking'))
  })

  it('vary across seeds (no single fixed label fleet-wide)', () => {
    const seeds = Array.from({ length: 40 }, (_, i) => `seed-${i}`)
    const navLabels = new Set(seeds.map((s) => navCtaLabel(s, 'quote')))
    const headings = new Set(seeds.map((s) => widgetHeading(s, 'quote')))
    const subs = new Set(seeds.map((s) => widgetSubheading(s, 'quote')))
    const topbars = new Set(seeds.map((s) => topbarFallbackLine(s, 'quote')))
    const finishes = new Set(seeds.map((s) => quizFinishLine(s)))
    const eyebrows = new Set(seeds.map((s) => servicesGridEyebrow(s, 'quote')))
    expect(navLabels.size).toBeGreaterThan(4)
    expect(headings.size).toBeGreaterThan(4)
    expect(subs.size).toBeGreaterThan(3)
    expect(topbars.size).toBeGreaterThan(2)
    expect(finishes.size).toBeGreaterThan(2)
    expect(eyebrows.size).toBeGreaterThan(2)
  })

  it('never emits the legacy fleet-wide literals', () => {
    // These exact strings used to render identically on every engine site.
    const legacy = ['Get an Instant Quote', 'Get Quote', 'Recent jobs', 'Free estimates — book today']
    for (const text of ALL_CHROME_POOL_STRINGS) {
      expect(legacy, `legacy literal "${text}" still in pools`).not.toContain(text)
    }
  })

  it('hero CTA pools differ across engagement models for the same seed', () => {
    const seed = 'same-seed'
    const labels = new Set([
      heroCtaLabel(seed, 'quote'),
      heroCtaLabel(seed, 'order'),
      heroCtaLabel(seed, 'booking'),
      heroCtaLabel(seed, 'ticket'),
    ])
    expect(labels.size).toBe(4)
  })
})
