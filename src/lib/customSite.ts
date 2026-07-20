/**
 * Per-site custom render mode — types + sanitize/scope helpers.
 * When site_configs.render_mode = 'custom', the public renderer bypasses
 * the shared template engine and paints this artifact for that tenant only.
 *
 * Shared sanitize/validate/placeholder core is checked by
 * scripts/check-custom-site-core-sync.mjs (dashboard script is source of truth).
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

/**
 * Kill decorative outer cards around the engagement widget.
 * AI / clone CSS often paints `.widget-container` as a grey padded panel;
 * the calculator web component already has its own bordered card — that
 * outer shell must stay invisible.
 */
export const WIDGET_MOUNT_RESET_CSS = `
.widget-container,
.closet-widget-slot,
.closet-widget-mount,
.quote-embed,
.quote-slot,
.widget-wrap,
.quote-box,
.calculator-wrap {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  border-width: 0 !important;
  box-shadow: none !important;
  outline: none !important;
  padding: 1.5rem 1rem 2.5rem !important;
  max-width: none !important;
}
.closet-widget-mount {
  display: flex;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
}
`.trim()

const WIDGET_SHELL_CLASS_RE =
  /(?:widget-container|closet-widget-slot|quote-embed|quote-slot|widget-wrap|quote-box|calculator-wrap)/i

const WIDGET_COMMENT_RE = /<!--\s*CLOSET_WIDGET\b[\s\S]*?-->/gi
const WIDGET_MUSTACHE_RE = /\{\{\s*CLOSET_WIDGET\s*\}\}/gi

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
 * Canonicalize AI-mutated widget markers (`<!-- CLOSET_WIDGET theme="dark" -->`)
 * and keep a single mount point.
 */
export function normalizeWidgetPlaceholders(html: string): string {
  if (!html) return ''
  let out = html
  out = out.replace(WIDGET_COMMENT_RE, WIDGET_PLACEHOLDER)
  out = out.replace(WIDGET_MUSTACHE_RE, WIDGET_PLACEHOLDER)

  const first = out.indexOf(WIDGET_PLACEHOLDER)
  if (first >= 0) {
    const before = out.slice(0, first + WIDGET_PLACEHOLDER.length)
    const after = out
      .slice(first + WIDGET_PLACEHOLDER.length)
      .split(WIDGET_PLACEHOLDER)
      .join('')
    out = before + after
  }

  out = out.replace(
    /<(div|section)([^>]*\b(?:widget-container|closet-widget-slot)\b[^>]*)>\s*<\/\1>/gi,
    ''
  )
  return out
}

export function htmlHasInjectableWidget(html: string): boolean {
  const n = normalizeWidgetPlaceholders(html)
  return (
    n.includes(WIDGET_PLACEHOLDER) ||
    /<closet-(?:quote|order|booking|ticket)-widget\b/i.test(n)
  )
}

export function findEmptyWidgetShells(html: string): string[] {
  const shells: string[] = []
  const re =
    /<(div|section)([^>]*\b(?:widget-container|closet-widget-slot|quote-embed|quote-slot)\b[^>]*)>([\s\S]*?)<\/\1>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const inner = m[3] || ''
    const hasMount =
      /<!--\s*CLOSET_WIDGET\b/i.test(inner) ||
      /\{\{\s*CLOSET_WIDGET\s*\}\}/i.test(inner) ||
      /<closet-(?:quote|order|booking|ticket)-widget\b/i.test(inner)
    const withoutComments = inner.replace(/<!--[\s\S]*?-->/g, '').trim()
    if (!hasMount && withoutComments === '') {
      shells.push((m[2] || '').trim().slice(0, 120) || 'widget shell')
    }
  }
  return shells
}

/** Live HTML: shells that never received a real <closet-*-widget>. */
export function findUnmountedWidgetShells(html: string): string[] {
  const shells: string[] = []
  const re =
    /<(div|section)([^>]*\b(?:widget-container|closet-widget-slot|quote-embed|quote-slot)\b[^>]*)>([\s\S]*?)<\/\1>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const inner = m[3] || ''
    if (!/<closet-(?:quote|order|booking|ticket)-widget\b/i.test(inner)) {
      shells.push((m[2] || '').trim().slice(0, 120) || 'widget shell')
    }
  }
  return shells
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
  const parts: string[] = []
  let i = 0
  while (i < input.length) {
    while (i < input.length && /\s/.test(input[i])) {
      parts.push(input[i])
      i++
    }
    if (i >= input.length) break

    if (input[i] === '@') {
      const headerEnd = findHeaderEnd(input, i)
      const header = input.slice(i, headerEnd)
      parts.push(header)
      i = headerEnd
      if (input[i] === '{') {
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
 * Pure-JS HTML sanitizer. Keeps the widget HTML comment placeholder intact
 * while stripping scripts / event handlers / javascript: URLs.
 */
export function sanitizeCustomHtml(html: string): string {
  if (!html) return ''
  let out = html
  out = out.replace(/<\s*(script|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
  out = out.replace(/<\s*(script|iframe|object|embed|form)\b[^>]*\/?\s*>/gi, '')
  out = out.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  out = out.replace(/\s(href|src|action)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, ' $1="#"')
  out = out.replace(/\ssrcdoc\s*=\s*("[^"]*"|'[^']*')/gi, '')
  return normalizeWidgetPlaceholders(out)
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

/**
 * Replace decorative mount shells wrapping the live widget with a neutral
 * centering mount (no card chrome).
 */
export function unwrapWidgetMountShells(html: string): string {
  if (!html) return ''
  return html.replace(
    /<(div|section)([^>]*)>(\s*)(<closet-(?:quote|order|booking|ticket)-widget\b[\s\S]*?<\/closet-[^>]+>)(\s*)<\/\1>/gi,
    (full, _tag, attrs: string, _pre, widget: string) => {
      if (!WIDGET_SHELL_CLASS_RE.test(attrs || '')) return full
      return `<div class="closet-widget-mount">${widget}</div>`
    }
  )
}

export function injectWidgetPlaceholder(
  html: string,
  widgetHtml: string
): string {
  let out = normalizeWidgetPlaceholders(html)
  if (out.includes(WIDGET_PLACEHOLDER)) {
    out = out.split(WIDGET_PLACEHOLDER).join(widgetHtml)
  }
  if (out.includes(WIDGET_PLACEHOLDER_ALT)) {
    out = out.split(WIDGET_PLACEHOLDER_ALT).join(widgetHtml)
  }
  // Paired or self-closing engagement web components.
  out = out.replace(
    /<closet-(?:quote|order|booking|ticket)-widget\b[^>]*\/>/gi,
    widgetHtml
  )
  out = out.replace(
    /<closet-(?:quote|order|booking|ticket)-widget\b[^>]*>\s*<\/closet-(?:quote|order|booking|ticket)-widget>/gi,
    widgetHtml
  )
  return unwrapWidgetMountShells(out)
}

export type CustomPublishCheck = {
  ok: boolean
  warnings: string[]
  errors: string[]
}

/**
 * Pre-publish validation. Missing / empty home widget mounts are hard errors.
 */
export function validateCustomConfig(config: CustomSiteConfig): CustomPublishCheck {
  const warnings: string[] = []
  const errors: string[] = []
  const pageKeys = Object.keys(config.pages || {})
  if (pageKeys.length === 0) {
    errors.push('No pages in custom config — at least "/" is required.')
  }

  const home = config.pages['/'] || config.pages['']
  if (!home) {
    errors.push('No home page ("/") — visitors hitting / will 404 or fall back.')
  } else {
    const homeHtml = home.html || ''
    if (!htmlHasInjectableWidget(homeHtml)) {
      errors.push(
        `Home page is missing a live engagement widget mount. Embed exactly ${WIDGET_PLACEHOLDER} (no attributes) inside the quote/CTA section.`
      )
    }
    const emptyShells = findEmptyWidgetShells(homeHtml)
    if (emptyShells.length > 0) {
      errors.push(
        `Home page has an empty widget container (${emptyShells[0]}) with no ${WIDGET_PLACEHOLDER} inside — visitors see a blank box instead of the calculator.`
      )
    }
  }

  for (const [path, page] of Object.entries(config.pages || {})) {
    const html = page?.html || ''
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
  return { ok: errors.length === 0, warnings, errors }
}
