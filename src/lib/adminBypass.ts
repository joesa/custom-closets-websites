/**
 * Admin bypass for pending/suspended tenant previews.
 * Cookie is set by proxy on the response; the page must also honor the
 * matching ?admin_bypass= query on the same request or the first click
 * still hits the under-construction holding page.
 */
export function isAdminBypassRequest(opts: {
  cookieValue?: string | null
  queryValue?: string | null
  secret?: string | null
}): boolean {
  if (opts.cookieValue === 'true') return true
  const secret = (opts.secret || 'admin_bypass_default_secret').trim()
  const query = (opts.queryValue || '').trim()
  return Boolean(secret && query && query === secret)
}
