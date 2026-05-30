import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const url = req.nextUrl;

  // Get the hostname (e.g., 'lumina.closetquotes.com' or 'localhost:3000')
  let hostname = req.headers.get('host') || '';

  // Remove the port if running locally
  hostname = hostname.split(':')[0];

  // Silently rewrite the request to a dynamic route folder: /app/[hostname]/...
  // We keep the rest of the pathname intact so /api or other routes could theoretically work
  // if nested, but the main page is /app/[hostname]/page.tsx
  url.pathname = `/${hostname}${url.pathname}`;
  // Check for admin_bypass. Only honor it when ADMIN_BYPASS_SECRET is configured
  // and the provided value matches exactly — never fall back to a hardcoded
  // literal, which would let anyone preview pending/suspended sites.
  const adminBypass = url.searchParams.get('admin_bypass');
  const bypassSecret = process.env.ADMIN_BYPASS_SECRET;
  const response = NextResponse.rewrite(url);

  if (bypassSecret && adminBypass === bypassSecret) {
    response.cookies.set('admin_bypass', 'true', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, images, APIs, static files)
    '/((?!api|_next/static|_next/image|favicon.ico|brands).*)',
  ],
};
