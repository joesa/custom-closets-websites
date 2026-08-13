/**
 * Pure render-pipeline helpers for custom (Full Redesign) sites.
 *
 * ORDER MATTERS: sanitize FIRST, inject the live widget LAST.
 * `sanitizeCustomHtml` → `normalizeWidgetPlaceholders` canonicalizes any live
 * `<closet-*-widget>` tag back into the `<!-- CLOSET_WIDGET -->` placeholder.
 * The previous pipeline injected the widget and then sanitized, which silently
 * converted the just-injected widget back into an inert comment — every custom
 * site shipped without its engagement engine even though the database artifact,
 * widget scripts, and contractor settings were all correct.
 */

import { PUBLIC_API_URL, WIDGET_CDN_URL } from '@/lib/urls';
import {
  type CustomPageArtifact,
  type CustomSiteConfig,
  CUSTOM_SITE_IMG_PERF_CSS,
  WIDGET_MOUNT_RESET_CSS,
  appendPreviewQueryToInternalLinks,
  decorateCustomSiteImages,
  injectWidgetPlaceholder,
  sanitizeCustomCss,
  sanitizeCustomHtml,
  scopeCss,
} from '@/lib/customSite';

export const CUSTOM_SITE_SCOPE = '[data-custom-site]';

export type EngagementModel = 'quote' | 'order' | 'booking' | 'ticket';

const LIVE_WIDGET_RE = /<closet-(?:quote|order|booking|ticket)-widget\b[^>]*data-contractor-id=/i;

export function buildWidgetElement(
  widgetId: string,
  engagementModel: EngagementModel = 'quote'
): string {
  // Web components from closet-widget/dist/widget.js — same attrs ClientPage uses.
  const tag =
    engagementModel === 'order'
      ? 'closet-order-widget'
      : engagementModel === 'booking'
        ? 'closet-booking-widget'
        : engagementModel === 'ticket'
          ? 'closet-ticket-widget'
          : 'closet-quote-widget';
  return `<${tag} data-contractor-id="${widgetId}" data-api-url="${PUBLIC_API_URL}"></${tag}>`;
}

/** Canary: true when the composed HTML carries a mounted engagement widget. */
export function renderedHtmlHasLiveWidget(html: string): boolean {
  return LIVE_WIDGET_RE.test(html);
}

/** Sanitize the stored AI HTML first, then inject the trusted widget element. */
function composePageHtml(
  page: CustomPageArtifact,
  widgetEl: string,
  previewQuery?: string | null
): string {
  const sanitized = decorateCustomSiteImages(sanitizeCustomHtml(page.html || ''));
  let html = injectWidgetPlaceholder(sanitized, widgetEl);
  if (previewQuery) {
    html = appendPreviewQueryToInternalLinks(html, previewQuery);
  }
  return html;
}

export function prepareInlineHtml(
  page: CustomPageArtifact,
  custom: CustomSiteConfig,
  widgetId: string,
  engagementModel: EngagementModel,
  previewQuery?: string | null
): { html: string; css: string } {
  const widgetEl = buildWidgetElement(widgetId, engagementModel);
  const html = composePageHtml(page, widgetEl, previewQuery);
  const combinedCss = [custom.globalCss || '', page.css || ''].filter(Boolean).join('\n');
  // Site CSS first, then mount reset so AI grey "outer boxes" cannot win.
  const css = [
    scopeCss(sanitizeCustomCss(combinedCss), CUSTOM_SITE_SCOPE),
    scopeCss(WIDGET_MOUNT_RESET_CSS, CUSTOM_SITE_SCOPE),
    scopeCss(CUSTOM_SITE_IMG_PERF_CSS, CUSTOM_SITE_SCOPE),
  ]
    .filter(Boolean)
    .join('\n');
  return { html, css };
}

export function buildSrcDoc(
  page: CustomPageArtifact,
  custom: CustomSiteConfig,
  widgetId: string,
  engagementModel: EngagementModel,
  previewQuery?: string | null
): string {
  const widgetEl = buildWidgetElement(widgetId, engagementModel);
  // Sanitize even in iframe mode — sandbox is not a substitute for stripping
  // script/event-handler payloads — and inject the widget only afterwards.
  const bodyHtml = composePageHtml(page, widgetEl, previewQuery);
  const css = [
    sanitizeCustomCss([custom.globalCss || '', page.css || ''].filter(Boolean).join('\n')),
    WIDGET_MOUNT_RESET_CSS,
    CUSTOM_SITE_IMG_PERF_CSS,
  ]
    .filter(Boolean)
    .join('\n');
  const title = page.title ? `<title>${escapeHtml(page.title)}</title>` : '';
  // Widget script is the only intentional script; body HTML is sanitized.
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>${title}<style>${css}</style></head><body>${bodyHtml}<script src="${WIDGET_CDN_URL}" defer></script></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
