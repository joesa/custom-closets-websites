import { NextResponse } from 'next/server'
import { decryptMediaToken } from '@/lib/mediaProxy'

export const runtime = 'nodejs'

/**
 * Opaque media proxy: `/api/a/<encrypted-token>` → streams the public
 * site-assets object from Supabase without exposing the storage URL in HTML.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const ref = decryptMediaToken(token)
  if (!ref) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
  if (!base) {
    return NextResponse.json({ error: 'Media proxy not configured' }, { status: 500 })
  }

  const upstreamUrl = `${base}/storage/v1/object/public/${ref.bucket}/${ref.path
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/')}`

  let res: Response
  try {
    res = await fetch(upstreamUrl, {
      // CDN-friendly; Supabase public objects are immutable by path.
      next: { revalidate: 86400 },
    })
  } catch {
    return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 })
  }

  if (!res.ok || !res.body) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: res.status === 404 ? 404 : 502 }
    )
  }

  const contentType = res.headers.get('content-type') || 'application/octet-stream'
  const headers = new Headers()
  headers.set('Content-Type', contentType)
  headers.set(
    'Cache-Control',
    'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400'
  )
  const len = res.headers.get('content-length')
  if (len) headers.set('Content-Length', len)

  return new NextResponse(res.body, { status: 200, headers })
}
