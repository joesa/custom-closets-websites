import { createCipheriv, createDecipheriv, createHash, createHmac } from 'crypto'

/**
 * Opaque media proxy for public site-assets URLs.
 *
 * Visitors see `/api/a/<token>` on the tenant hostname instead of
 * `*.supabase.co/storage/v1/object/public/...`. The token is AES-256-GCM
 * encrypted (deterministic IV) so the storage path is not readable from the
 * HTML, and only our server can resolve it.
 */

const PUBLIC_OBJECT_RE =
  /^https?:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/i

function mediaSecret(): string | null {
  const secret =
    process.env.MEDIA_PROXY_SECRET?.trim() ||
    process.env.REVALIDATE_SECRET?.trim() ||
    ''
  return secret || null
}

function keyFromSecret(secret: string): Buffer {
  return createHash('sha256').update(`media-proxy:v1:${secret}`).digest()
}

export function parseSupabasePublicObjectUrl(
  url: string
): { bucket: string; path: string } | null {
  const m = PUBLIC_OBJECT_RE.exec((url || '').trim())
  if (!m) return null
  const bucket = decodeURIComponent(m[1])
  const path = decodeURIComponent(m[2].split('?')[0].split('#')[0])
  if (!bucket || !path || path.includes('..')) return null
  return { bucket, path }
}

/** Encrypt bucket/path into a stable URL-safe token. */
export function encryptMediaRef(bucket: string, path: string): string | null {
  const secret = mediaSecret()
  if (!secret) return null
  const plaintext = `${bucket}/${path}`
  const key = keyFromSecret(secret)
  // Deterministic IV so the same asset keeps one cacheable URL across renders.
  const iv = createHmac('sha256', key).update(`iv:${plaintext}`).digest().subarray(0, 12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64url')
}

export function decryptMediaToken(
  token: string
): { bucket: string; path: string } | null {
  const secret = mediaSecret()
  if (!secret || !token) return null
  try {
    const buf = Buffer.from(token, 'base64url')
    if (buf.length < 12 + 16 + 1) return null
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const enc = buf.subarray(28)
    const decipher = createDecipheriv('aes-256-gcm', keyFromSecret(secret), iv)
    decipher.setAuthTag(tag)
    const plaintext = Buffer.concat([
      decipher.update(enc),
      decipher.final(),
    ]).toString('utf8')
    const slash = plaintext.indexOf('/')
    if (slash <= 0) return null
    const bucket = plaintext.slice(0, slash)
    const path = plaintext.slice(slash + 1)
    if (!bucket || !path || path.includes('..')) return null
    return { bucket, path }
  } catch {
    return null
  }
}

/** Turn a public Supabase object URL into `/api/a/<token>` (or null if not ours / no secret). */
export function cloakSupabasePublicUrl(url: string): string | null {
  const parsed = parseSupabasePublicObjectUrl(url)
  if (!parsed) return null
  const token = encryptMediaRef(parsed.bucket, parsed.path)
  if (!token) return null
  return `/api/a/${token}`
}

/**
 * Rewrite every public Supabase storage URL in HTML or CSS to an opaque
 * same-origin `/api/a/...` proxy URL.
 */
export function cloakStorageUrlsInText(text: string): string {
  if (!text || !mediaSecret()) return text
  return text.replace(
    /https?:\/\/[^"'\\\s)]+\.supabase\.co\/storage\/v1\/object\/public\/[^"'\\\s)]+/gi,
    (match) => {
      // Trim trailing punctuation that sometimes sticks to URLs in prose.
      const cleaned = match.replace(/[.,;:]+$/, '')
      const cloaked = cloakSupabasePublicUrl(cleaned)
      if (!cloaked) return match
      return cloaked + match.slice(cleaned.length)
    }
  )
}

/** Cloak storage URLs in a custom site config for public/draft render (server-only). */
export function cloakCustomSiteConfig<T extends {
  globalCss?: string
  pages: Record<string, { html: string; css?: string; title?: string; description?: string }>
}>(config: T): T {
  if (!mediaSecret()) return config
  const pages: T['pages'] = {} as T['pages']
  for (const [path, page] of Object.entries(config.pages || {})) {
    pages[path] = {
      ...page,
      html: cloakStorageUrlsInText(page.html || ''),
      css: page.css ? cloakStorageUrlsInText(page.css) : page.css,
    }
  }
  return {
    ...config,
    globalCss: config.globalCss
      ? cloakStorageUrlsInText(config.globalCss)
      : config.globalCss,
    pages,
  }
}
