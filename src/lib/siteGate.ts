import type { BrandConfig } from '@/types/config';

export type SiteGate = 'ok' | 'pending' | 'launch_locked' | 'blocked' | 'edit_locked';

/**
 * Decide whether a tenant site is publicly viewable based on its site_status.
 *
 *  - 'pending_approval'         -> under-construction holding page
 *  - 'awaiting_launch_payment'  -> paywall (preview approved, launch not paid)
 *  - 'suspended'                -> blocked entirely (404)
 *  - 'active'                   -> full site
 *  - editInPlace                -> holding page (admin editing offline), but
 *                                  only for EDIT_IN_PLACE_MAX_MS after it was
 *                                  switched on — see below
 *
 * `validationStatus` deliberately does NOT gate rendering. It used to: any
 * failed validation forced the holding page. On 2026-08-13 an edit dropped a
 * homepage's only <h1>, and that single cosmetic finding took the whole site
 * offline for hours — far worse than the defect it was reacting to, and it
 * blanked the client's preview link too.
 *
 * Validation remains a launch gate where it belongs: the admin approve route
 * refuses to approve a site unless validation_status = 'passed', so a site
 * that never passed QA still cannot go public. Losing the render-time net only
 * matters if someone force-sets site_status directly in the database, which is
 * a fair trade against outages caused by minor findings.
 *
 * A valid admin_bypass cookie always renders the live site so operators can
 * preview pending/suspended tenants and use edit-in-place.
 *
 * edit-in-place expires. It outranks site_status, so while it is set a live,
 * paid site serves a holding page; there was no expiry and no operator timeout,
 * meaning an admin who opened edit mode and got distracted left a business's
 * homepage as "Site Being Updated" indefinitely with nothing reporting it. The
 * direction of failure is deliberate: after the window the real site returns,
 * because visitors seeing a half-finished edit is a smaller harm than a site
 * that never comes back. A site whose flag predates edit_in_place_started_at
 * has a null timestamp and is treated as expired for the same reason.
 */

/** How long an edit-in-place session holds the public site offline. */
export const EDIT_IN_PLACE_MAX_MS = 2 * 60 * 60 * 1000;

/** Whether an edit-in-place session is still within its window. */
export function editInPlaceActive(
  config: Pick<BrandConfig, 'editInPlace' | 'editInPlaceStartedAt'>,
  nowMs: number = Date.now()
): boolean {
  if (!config.editInPlace) return false;
  const startedAt = config.editInPlaceStartedAt
    ? Date.parse(config.editInPlaceStartedAt)
    : NaN;
  if (!Number.isFinite(startedAt)) return false;
  return nowMs - startedAt < EDIT_IN_PLACE_MAX_MS;
}
export function getSiteGate(config: BrandConfig, isAdminBypass: boolean): SiteGate {
  if (isAdminBypass) return 'ok';
  if (editInPlaceActive(config)) return 'edit_locked';
  const tempPreviewActive = Boolean(
    config.tempPreviewExpiresAt &&
      Number.isFinite(Date.parse(config.tempPreviewExpiresAt)) &&
      Date.parse(config.tempPreviewExpiresAt) > Date.now()
  );
  switch (config.siteStatus) {
    case 'pending_approval':
      return tempPreviewActive ? 'ok' : 'pending';
    case 'awaiting_launch_payment':
      return tempPreviewActive ? 'ok' : 'launch_locked';
    case 'suspended':
      return 'blocked';
    default:
      return 'ok';
  }
}
