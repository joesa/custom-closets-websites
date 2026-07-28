import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { decryptMediaToken } from '@/lib/mediaProxy'

export const runtime = 'nodejs'

/** Long-edge cap so gallery pages don't decode multi‑MP JPEGs on first paint. */
const MAX_EDGE = 1400
const MAX_BYTES_BEFORE_RESIZE = 120_000

/**
 * Opaque media proxy: `/api/a/<encrypted-token>` → streams the public
 * site-assets object from Supabase without exposing the storage URL in HTML.
 * Large photos are downscaled (WebP when accepted) to avoid freezing Chromium
 * when many full-resolution images hit the main thread at once.
 */
export async function GET(
  req: Request,
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

  const upstreamType = (res.headers.get('content-type') || '').toLowerCase()
  const isRaster =
    upstreamType.includes('jpeg') ||
    upstreamType.includes('jpg') ||
    upstreamType.includes('png') ||
    upstreamType.includes('webp') ||
    /\.(jpe?g|png|webp)$/i.test(ref.path)

  const accept = req.headers.get('accept') || ''
  const preferWebp = /\bimage\/webp\b/i.test(accept)

  if (isRaster) {
    try {
      const buf = Buffer.from(await res.arrayBuffer())
      const meta = await sharp(buf, { failOn: 'none' }).metadata()
      const w = meta.width || 0
      const h = meta.height || 0
      const longEdge = Math.max(w, h)
      const needsResize =
        buf.length > MAX_BYTES_BEFORE_RESIZE || longEdge > MAX_EDGE

      if (needsResize && longEdge > 0) {
        let pipeline = sharp(buf, { failOn: 'none' }).rotate()
        if (longEdge > MAX_EDGE) {
          pipeline = pipeline.resize({
            width: w >= h ? MAX_EDGE : undefined,
            height: h > w ? MAX_EDGE : undefined,
            fit: 'inside',
            withoutEnlargement: true,
          })
        }
        const outType = preferWebp ? 'image/webp' : 'image/jpeg'
        const outBuf =
          preferWebp
            ? await pipeline.webp({ quality: 78 }).toBuffer()
            : await pipeline.jpeg({ quality: 78, mozjpeg: true }).toBuffer()

        const headers = new Headers()
        headers.set('Content-Type', outType)
        headers.set(
          'Cache-Control',
          'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400'
        )
        headers.set('Content-Length', String(outBuf.length))
        headers.set('Vary', 'Accept')
        headers.set('X-Media-Proxy', 'resized')
        return new NextResponse(new Uint8Array(outBuf), { status: 200, headers })
      }

      // Small enough — return original bytes (still cacheable).
      const headers = new Headers()
      headers.set('Content-Type', upstreamType || 'application/octet-stream')
      headers.set(
        'Cache-Control',
        'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400'
      )
      headers.set('Content-Length', String(buf.length))
      headers.set('X-Media-Proxy', 'passthrough')
      return new NextResponse(new Uint8Array(buf), { status: 200, headers })
    } catch (err) {
      console.warn('[media-proxy] resize failed, falling back to upstream', err)
      // Fall through to stream original if we still have it — re-fetch.
      try {
        const again = await fetch(upstreamUrl, { next: { revalidate: 86400 } })
        if (again.ok && again.body) {
          const headers = new Headers()
          headers.set(
            'Content-Type',
            again.headers.get('content-type') || 'application/octet-stream'
          )
          headers.set(
            'Cache-Control',
            'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400'
          )
          const len = again.headers.get('content-length')
          if (len) headers.set('Content-Length', len)
          headers.set('X-Media-Proxy', 'fallback')
          return new NextResponse(again.body, { status: 200, headers })
        }
      } catch {
        /* ignore */
      }
      return NextResponse.json({ error: 'Image processing failed' }, { status: 502 })
    }
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
