import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

function makeRequest(host: string, path: string) {
  return new NextRequest(`https://${host}${path}`, {
    headers: { host },
  });
}

function rewriteUrl(response: Response) {
  return new URL(response.headers.get('x-middleware-rewrite')!);
}

describe('proxy — reserved app path routing', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.ditchtheform.com';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
  });

  it('rewrites /login on a tenant subdomain to the dashboard app', () => {
    const req = makeRequest('sotoy-parking-services.ditchtheform.com', '/login');
    const res = proxy(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
    const location = rewriteUrl(res);
    expect(location.hostname).toBe('www.ditchtheform.com');
    expect(location.pathname).toBe('/login');
  });

  it('rewrites /dashboard on a custom tenant domain to the dashboard app', () => {
    const req = makeRequest('www.sotoyparkingservices.com', '/dashboard');
    const res = proxy(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
    const location = rewriteUrl(res);
    expect(location.hostname).toBe('www.ditchtheform.com');
    expect(location.pathname).toBe('/dashboard');
  });

  it('rewrites nested reserved paths like /admin/users', () => {
    const req = makeRequest('sotoy-parking-services.ditchtheform.com', '/admin/users');
    const res = proxy(req);
    expect(res.status).toBe(200);
    const location = rewriteUrl(res);
    expect(location.pathname).toBe('/admin/users');
  });

  it('does NOT redirect reserved paths when already on the dashboard host (avoids a loop)', () => {
    const req = makeRequest('www.ditchtheform.com', '/dashboard');
    const res = proxy(req);
    // No redirect — falls through to the normal hostname rewrite.
    expect(res.status).not.toBe(307);
    expect(res.headers.get('location')).toBeNull();
  });

  it('does not redirect ordinary tenant site paths (normal page rewrite unaffected)', () => {
    const req = makeRequest('sotoy-parking-services.ditchtheform.com', '/about');
    const res = proxy(req);
    expect(res.headers.get('location')).toBeNull();
  });

  it('does not redirect the tenant homepage', () => {
    const req = makeRequest('sotoy-parking-services.ditchtheform.com', '/');
    const res = proxy(req);
    expect(res.headers.get('location')).toBeNull();
  });

  it('rewrites dashboard-owned APIs but leaves renderer APIs local', () => {
    const dashboardApi = proxy(
      makeRequest('sotoy-parking-services.ditchtheform.com', '/api/admin/sites')
    );
    expect(rewriteUrl(dashboardApi).hostname).toBe('www.ditchtheform.com');

    const rendererApi = proxy(
      makeRequest('sotoy-parking-services.ditchtheform.com', '/api/revalidate')
    );
    expect(rendererApi.headers.get('x-middleware-rewrite')).toBeNull();
  });
});
