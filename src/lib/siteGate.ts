import type { BrandConfig } from '@/types/config';

export type SiteGate = 'ok' | 'pending' | 'launch_locked' | 'blocked' | 'edit_locked';

/**
 * Decide whether a tenant site is publicly viewable based on its site_status.
 *
 *  - 'pending_approval'         -> under-construction holding page
 *  - 'awaiting_launch_payment'  -> paywall (preview approved, launch not paid)
 *  - 'suspended'                -> blocked entirely (404)
 *  - 'active'                   -> full site
 *  - editInPlace                -> holding page (admin editing offline)
 *
 * A `validationStatus: 'failed'` ALWAYS forces the holding page, regardless
 * of siteStatus — a defense-in-depth safety net (in addition to the admin
 * approve route's own server-side check) so a site that fails the automated
 * QA battery (broken links/images, missing nav, etc.) can never become fully
 * public even via a stale/forced site_status.
 *
 * A valid admin_bypass cookie always renders the live site so operators can
 * preview pending/suspended tenants and use edit-in-place.
 */
export function getSiteGate(config: BrandConfig, isAdminBypass: boolean): SiteGate {
  if (isAdminBypass) return 'ok';
  if (config.editInPlace) return 'edit_locked';
  if (config.validationStatus === 'failed') return 'pending';
  switch (config.siteStatus) {
    case 'pending_approval':
      return 'pending';
    case 'awaiting_launch_payment':
      return 'launch_locked';
    case 'suspended':
      return 'blocked';
    default:
      return 'ok';
  }
}
