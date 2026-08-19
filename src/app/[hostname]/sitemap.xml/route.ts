import { getActiveConfig } from '@/lib/getConfig'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Per-tenant sitemap.
 *
 * There was none — and no robots.txt either. A crawler asking a tenant site for
 * /sitemap.xml fell through the [slug] catch-all and got a 404 HTML page, on a
 * product sold to small businesses as their marketing site. The page list is
 * whatever the tenant actually has, so a five-page site does not advertise ten.
 */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ hostname: string }> }
) {
  const { hostname } = await params
  const config = await getActiveConfig(hostname)

  const origin = `https://${hostname}`
  const paths = ['/']
  for (const page of config?.pagesConfig ?? []) {
    if (page.is_active === false) continue
    const slug = page.slug?.trim()
    if (slug && slug !== '/' && slug !== 'home') {
      paths.push(`/${slug.replace(/^\/+/, '')}`)
    }
  }

  const lastmod = new Date().toISOString()
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...new Set(paths)]
  .map(
    (path) =>
      `  <url><loc>${xmlEscape(origin + path)}</loc><lastmod>${lastmod}</lastmod>` +
      `<priority>${path === '/' ? '1.0' : '0.7'}</priority></url>`
  )
  .join('\n')}
</urlset>`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  })
}
