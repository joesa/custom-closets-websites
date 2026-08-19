import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Crawl and share metadata on a product sold as a marketing site.
 *
 * Verified against production before this existed: /sitemap.xml and
 * /robots.txt both returned 404 on every tenant, because the proxy rewrites
 * everything into [hostname]/… and there was nothing there to answer. Sharing a
 * tenant link produced a bare grey rectangle — no Open Graph, no Twitter card,
 * no canonical anywhere in the renderer.
 */
const here = (...p: string[]) => join(__dirname, ...p)

describe('sitemap', () => {
  const source = readFileSync(here('sitemap.xml', 'route.ts'), 'utf8')

  it('lists only the pages the tenant actually has', () => {
    expect(source).toContain('config?.pagesConfig')
    // A page turned off in the dashboard must not be advertised to crawlers.
    expect(source).toContain('page.is_active === false')
  })

  it('escapes URLs rather than interpolating them raw into XML', () => {
    expect(source).toContain('xmlEscape(origin + path)')
  })
})

describe('robots', () => {
  const source = readFileSync(here('robots.txt', 'route.ts'), 'utf8')

  it('points crawlers at the sitemap when the site is live', () => {
    expect(source).toContain('Sitemap: https://${hostname}/sitemap.xml')
  })

  it('disallows everything on a site that is not live yet', () => {
    expect(source).toContain('Disallow: /')
    expect(source).toContain("config?.siteStatus === 'active'")
  })
})

describe('share metadata', () => {
  const source = readFileSync(here('layout.tsx'), 'utf8')

  it('emits Open Graph, Twitter and a canonical', () => {
    expect(source).toContain('openGraph')
    expect(source).toContain('twitter')
    expect(source).toContain('alternates: { canonical: url }')
    expect(source).toContain('metadataBase')
  })
})

describe('holding pages are never indexed', () => {
  const source = readFileSync(here('page.tsx'), 'utf8')

  it('noindexes an edit-in-place site even though it is active and paid', () => {
    // getSiteGate returns edit_locked before it looks at siteStatus, so a live
    // site can serve "Site Being Updated" while an edit session is open.
    // The metadata must agree with the gate about when that is happening,
    // which is why both call editInPlaceActive rather than reading the flag —
    // an expired session shows the real site and must be indexable again.
    expect(source).toContain('editInPlaceActive(config)')
    expect(source).toContain('robots: { index: false, follow: false }')
  })
})
