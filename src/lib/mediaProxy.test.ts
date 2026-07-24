import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import {
  cloakStorageUrlsInText,
  cloakSupabasePublicUrl,
  decryptMediaToken,
  encryptMediaRef,
  parseSupabasePublicObjectUrl,
} from './mediaProxy'

const SAMPLE =
  'https://vtlvqatzsolycqzeknru.supabase.co/storage/v1/object/public/site-assets/custom/abc/photo.jpg'

describe('mediaProxy', () => {
  const prev = { ...process.env }

  beforeEach(() => {
    process.env.REVALIDATE_SECRET = 'test-media-proxy-secret-123'
    delete process.env.MEDIA_PROXY_SECRET
  })

  afterEach(() => {
    process.env = { ...prev }
  })

  it('parses public object urls', () => {
    expect(parseSupabasePublicObjectUrl(SAMPLE)).toEqual({
      bucket: 'site-assets',
      path: 'custom/abc/photo.jpg',
    })
  })

  it('round-trips encrypted tokens', () => {
    const token = encryptMediaRef('site-assets', 'custom/abc/photo.jpg')
    expect(token).toBeTruthy()
    expect(decryptMediaToken(token!)).toEqual({
      bucket: 'site-assets',
      path: 'custom/abc/photo.jpg',
    })
  })

  it('is deterministic for the same path', () => {
    expect(encryptMediaRef('site-assets', 'a/b.jpg')).toBe(
      encryptMediaRef('site-assets', 'a/b.jpg')
    )
  })

  it('cloaks urls in html', () => {
    const html = `<img src="${SAMPLE}" alt="x">`
    const out = cloakStorageUrlsInText(html)
    expect(out).not.toContain('supabase.co')
    expect(out).toMatch(/src="\/api\/a\/[A-Za-z0-9_-]+"/)
  })

  it('cloakSupabasePublicUrl returns opaque path', () => {
    const cloaked = cloakSupabasePublicUrl(SAMPLE)
    expect(cloaked?.startsWith('/api/a/')).toBe(true)
  })

  it('leaves urls alone when secret missing', () => {
    delete process.env.REVALIDATE_SECRET
    delete process.env.MEDIA_PROXY_SECRET
    expect(cloakStorageUrlsInText(`<img src="${SAMPLE}">`)).toContain('supabase.co')
  })
})
