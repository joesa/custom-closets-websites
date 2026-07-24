/**
 * Admin Custom Build draft preview helpers.
 * Draft HTML is only painted when the admin bypass cookie is present AND
 * either ?draft=1 is on the URL or the custom_draft_preview session cookie
 * was set by a prior ?draft=1 visit.
 */

export function shouldPaintCustomDraft(opts: {
  isAdminBypass: boolean
  draftParam?: string | null
  draftPreviewCookie?: string | null
}): boolean {
  if (!opts.isAdminBypass) return false
  return (
    opts.draftParam === '1' || opts.draftPreviewCookie === 'true'
  )
}

/**
 * Query string to stitch onto internal custom-site links during draft preview
 * so About / Services / etc. keep the preview session.
 */
export function buildCustomDraftPreviewQuery(opts: {
  adminBypassParam?: string | null
}): string {
  const params = new URLSearchParams()
  params.set('draft', '1')
  const bypass = (opts.adminBypassParam || '').trim()
  if (bypass) params.set('admin_bypass', bypass)
  return params.toString()
}
