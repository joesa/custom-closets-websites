/**
 * Admin Custom Build draft preview helpers.
 *
 * Draft HTML is only painted when the admin is bypassing gates AND the URL
 * explicitly has ?draft=1. A leftover draft-preview cookie must NOT keep the
 * live site in draft mode after Publish (that caused the sticky yellow banner).
 */

export function shouldPaintCustomDraft(opts: {
  isAdminBypass: boolean
  draftParam?: string | null
  /** @deprecated ignored — draft requires ?draft=1 on the URL */
  draftPreviewCookie?: string | null
}): boolean {
  if (!opts.isAdminBypass) return false
  return opts.draftParam === '1'
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
