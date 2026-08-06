import { DEFAULT_WIDGET_CDN_BASE, withWidgetCacheBust } from '@/lib/widgetCdn'

function defaultWidgetScriptUrl(): string {
  const site =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    ''
  // Local dev should always use /public/widget.js so previews match latest bundle.
  if (/localhost|127\.0\.0\.1/.test(site)) return '/widget.js'
  const base =
    process.env.NEXT_PUBLIC_WIDGET_CDN_URL?.trim() || DEFAULT_WIDGET_CDN_BASE
  return withWidgetCacheBust(base)
}

export const WIDGET_CDN_URL = defaultWidgetScriptUrl()

export const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, '') ||
  'https://www.ditchtheform.com'

function originOf(url: string): string | null {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

/**
 * Third-party origins the page hits before it is interactive: the widget bundle
 * and the API call it makes for contractor settings. Preconnecting overlaps DNS
 * and TLS with HTML parsing instead of paying for them serially.
 */
export const PRECONNECT_ORIGINS = Array.from(
  new Set(
    [originOf(WIDGET_CDN_URL), originOf(PUBLIC_API_URL)].filter(
      (origin): origin is string => Boolean(origin)
    )
  )
)
