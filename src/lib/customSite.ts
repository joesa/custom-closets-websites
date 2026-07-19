/**
 * Per-site custom render mode — types + sanitize/scope helpers.
 * When site_configs.render_mode = 'custom', the public renderer bypasses
 * the shared template engine and paints this artifact for that tenant only.
 */

export type CustomRenderMode = 'inline' | 'iframe'

export type CustomPageArtifact = {
  html: string
  css?: string
  title?: string
  description?: string
}

export type CustomSiteConfig = {
  mode: CustomRenderMode
  globalCss?: string
  pages: Record<string, CustomPageArtifact>
}

/** Marker the AI embeds so we can inject the live quote/booking widget. */
export const WIDGET_PLACEHOLDER = '<!-- CLOSET_WIDGET -->'
export const WIDGET_PLACEHOLDER_ALT = '{{CLOSET_WIDGET}}'

export function isCustomSiteConfig(v: unknown): v is CustomSiteConfig {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  const o = v as CustomSiteConfig
  if (o.mode !== 'inline' && o.mode !== 'iframe') return false
  if (!o.pages || typeof o.pages !== 'object' || Array.isArray(o.pages)) return false
  return true
}

/** Normalize a path key to `/` or `/slug` form. */
export function normalizeCustomPath(path: string): string {
  const t = (path || '/').trim()
  if (!t || t === '/') return '/'
  const withSlash = t.startsWith('/') ? t : `/${t}`
  return withSlash.replace(/\/+$/, '') || '/'
}

export function getCustomPage(
  config: CustomSiteConfig | null | undefined,
  path: string
): CustomPageArtifact | null {
  if (!config?.pages) return null
  const key = normalizeCustomPath(path)
  return config.pages[key] || config.pages[key.slice(1)] || null
}

/**
 * Scope CSS rules to a wrapper so custom styles can't leak into the
 * platform chrome (navbar, etc.). Prefixes each selector with the scope.
 * @-rules (media/keyframes/font-face) are preserved with inner selectors scoped.
 */
export function scopeCss(css: string, scope: string): string {
  if (!css?.trim()) return ''
  // Strip HTML comments that models sometimes leave in CSS blobs.
  let input = css.replace(/\/\*[\s\S]*?\*\//g, '')
  // Very light pass: wrap bare rule blocks. Nested @media handled by
  // rewriting the selector list before each `{` that isn't an @-rule.
  const parts: string[] = []
  let i = 0
  while (i < input.length) {
    // Skip whitespace
    while (i < input.length && /\s/.test(input[i])) {
      parts.push(input[i])
      i++
    }
    if (i >= input.length) break

    if (input[i] === '@') {
      // Find the end of the @-rule header (either `;` for @import/@charset
      // or `{` for @media/@keyframes/@font-face).
      const headerEnd = findHeaderEnd(input, i)
      const header = input.slice(i, headerEnd)
      parts.push(header)
      i = headerEnd
      if (input[i] === '{') {
        // Find matching close brace and recursively scope the body for
        // @media/@supports; leave @keyframes/@font-face bodies untouched.
        const bodyEnd = findMatchingBrace(input, i)
        const body = input.slice(i + 1, bodyEnd)
        const isKeyframes = /@(?:-?\w+-)?keyframes/i.test(header)
        const isFontFace = /@font-face/i.test(header)
        parts.push('{')
        parts.push(isKeyframes || isFontFace ? body : scopeCss(body, scope))
        parts.push('}')
        i = bodyEnd + 1
      }
      continue
    }

    // Normal rule: selectors { body }
    const brace = input.indexOf('{', i)
    if (brace < 0) {
      parts.push(input.slice(i))
      break
    }
    const selectors = input.slice(i, brace).trim()
    const bodyEnd = findMatchingBrace(input, brace)
    const body = input.slice(brace + 1, bodyEnd)
    const scoped = selectors
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s === ':root' || s === 'html' || s === 'body' ? scope : `${scope} ${s}`))
      .join(', ')
    parts.push(`${scoped}{${body}}`)
    i = bodyEnd + 1
  }
  return parts.join('')
}

function findHeaderEnd(s: string, start: number): number {
  for (let i = start; i < s.length; i++) {
    if (s[i] === '{' || s[i] === ';') return i
  }
  return s.length
}

function findMatchingBrace(s: string, openIdx: number): number {
  let depth = 0
  for (let i = openIdx; i < s.length; i++) {
    if (s[i] === '{') depth++
    else if (s[i] === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return s.length - 1
}

/**
 * Pure-JS HTML sanitizer (no jsdom/DOMPurify). Keeps the widget HTML comment
 * placeholder intact while stripping scripts / event handlers / javascript: URLs.
 */
export function sanitizeCustomHtml(html: string): string {
  if (!html) return ''
  let out = html
  out = out.replace(/<\s*(script|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
  out = out.replace(/<\s*(script|iframe|object|embed|form)\b[^>]*\/?\s*>/gi, '')
  out = out.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  out = out.replace(/\s(href|src|action)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, ' $1="#"')
  out = out.replace(/\ssrcdoc\s*=\s*("[^"]*"|'[^']*')/gi, '')
  return out
}

/** Strip `@import` and `expression()` / `url(javascript:)` from CSS. */
export function sanitizeCustomCss(css: string): string {
  if (!css) return ''
  return css
    .replace(/@import\b[^;]*;?/gi, '')
    .replace(/expression\s*\(/gi, 'invalid(')
    .replace(/url\s*\(\s*['"]?\s*javascript:/gi, 'url(about:blank')
    .replace(/-moz-binding\s*:/gi, 'invalid:')
}

export function injectWidgetPlaceholder(
  html: string,
  widgetHtml: string
): string {
  let out = html
  if (out.includes(WIDGET_PLACEHOLDER)) {
    out = out.split(WIDGET_PLACEHOLDER).join(widgetHtml)
  }
  if (out.includes(WIDGET_PLACEHOLDER_ALT)) {
    out = out.split(WIDGET_PLACEHOLDER_ALT).join(widgetHtml)
  }
  // Replace any engagement web component the AI may have emitted (quote/order/booking/ticket).
  out = out.replace(
    /<closet-(?:quote|order|booking|ticket)-widget\b[^>]*>\s*<\/closet-(?:quote|order|booking|ticket)-widget>/gi,
    widgetHtml
  )
  return out
}

export type CustomPublishCheck = {
  ok: boolean
  warnings: string[]
  errors: string[]
}

/**
 * Lightweight pre-publish validation. Soft-warns on missing widget; hard-fails
 * on scripts / javascript: URLs that would survive an inline render.
 */
export function validateCustomConfig(config: CustomSiteConfig): CustomPublishCheck {
  const warnings: string[] = []
  const errors: string[] = []
  const pageKeys = Object.keys(config.pages || {})
  if (pageKeys.length === 0) {
    errors.push('No pages in custom config — at least "/" is required.')
  }
  if (!config.pages['/'] && !config.pages['']) {
    warnings.push('No home page ("/") — visitors hitting / will 404 or fall back.')
  }

  let hasWidget = false
  for (const [path, page] of Object.entries(config.pages || {})) {
    const html = page?.html || ''
    if (
      html.includes(WIDGET_PLACEHOLDER) ||
      html.includes(WIDGET_PLACEHOLDER_ALT) ||
      /<closet-(?:quote|order|booking|ticket)-widget\b/i.test(html)
    ) {
      hasWidget = true
    }
    if (/<script\b/i.test(html) && config.mode === 'inline') {
      errors.push(`Page ${path}: <script> tags are not allowed in inline mode (use iframe mode).`)
    }
    if (/javascript:/i.test(html)) {
      errors.push(`Page ${path}: javascript: URLs are not allowed.`)
    }
    if (/on\w+\s*=/i.test(html) && config.mode === 'inline') {
      warnings.push(`Page ${path}: inline event handlers will be stripped on render.`)
    }
  }
  if (!hasWidget) {
    warnings.push(
      `No engagement widget placeholder found. Embed ${WIDGET_PLACEHOLDER} (or a closet-*-widget tag) so leads still convert.`
    )
  }
  return { ok: errors.length === 0, warnings, errors }
}
