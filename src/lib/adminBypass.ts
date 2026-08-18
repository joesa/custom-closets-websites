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
  // No configured secret means no bypass. This used to default to the literal
  // 'admin_bypass_default_secret', so a deployment missing ADMIN_BYPASS_SECRET
  // would unlock every pending, suspended and pay-to-launch tenant site to
  // anyone who knew a string that was published in the source. proxy.ts:102
  // already failed closed; this path did not, and it is the one the page
  // component calls.
  const secret = (opts.secret || '').trim()
  const query = (opts.queryValue || '').trim()
  return Boolean(secret && query && query === secret)
}
