import type { BrandConfig } from '@/types/config';

export type SiteGate = 'ok' | 'pending' | 'launch_locked' | 'blocked';

/**
 * Decide whether a tenant site is publicly viewable based on its site_status.
 *
 *  - 'pending_approval'         -> under-construction holding page
 *  - 'awaiting_launch_payment'  -> paywall (preview approved, launch not paid)
 *  - 'suspended'                -> blocked entirely (404)
 *  - 'active'                   -> full site
 *
 * A `validationStatus: 'failed'` ALWAYS forces the holding page, regardless
 * of siteStatus — a defense-in-depth safety net (in addition to the admin
 * approve route's own server-side check) so a site that fails the automated
 * QA battery (broken links/images, missing nav, etc.) can never become fully
 * public even via a stale/forced site_status.
 *
 * A valid admin_bypass cookie always renders the live site so operators can
 * preview pending/suspended tenants.
 */
export function getSiteGate(config: BrandConfig, isAdminBypass: boolean): SiteGate {
  if (isAdminBypass) return 'ok';
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
