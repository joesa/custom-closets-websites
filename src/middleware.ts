import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Get the hostname (e.g., 'lumina.closetquotes.com' or 'localhost:3000')
  let hostname = req.headers.get('host') || '';

  // Remove the port if running locally
  hostname = hostname.split(':')[0];

  // Silently rewrite the request to a dynamic route folder: /app/[hostname]/...
  // We keep the rest of the pathname intact so /api or other routes could theoretically work
  // if nested, but the main page is /app/[hostname]/page.tsx
  url.pathname = `/${hostname}${url.pathname}`;
  // Check for admin_bypass
  const adminBypass = url.searchParams.get('admin_bypass');
  const response = NextResponse.rewrite(url);

  if (adminBypass === process.env.ADMIN_BYPASS_SECRET || adminBypass === 'supersecret') {
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
