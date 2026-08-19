import { getActiveConfig } from '@/lib/getConfig'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Per-tenant robots.txt.
 *
 * Also points crawlers at the sitemap. A site that is not yet live must not be
 * indexed — the same condition the page's `robots` metadata uses — so this is
 * derived from site status rather than shipped as a static allow-all.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ hostname: string }> }
) {
  const { hostname } = await params
  const config = await getActiveConfig(hostname)
  const live = config?.siteStatus === 'active'

  const body = live
    ? `User-agent: *\nAllow: /\n\nSitemap: https://${hostname}/sitemap.xml\n`
    : `User-agent: *\nDisallow: /\n`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  })
}
