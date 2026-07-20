'use client';

import Script from 'next/script';
import { PUBLIC_API_URL, WIDGET_CDN_URL } from '@/lib/urls';
import {
  type CustomPageArtifact,
  type CustomSiteConfig,
  WIDGET_MOUNT_RESET_CSS,
  injectWidgetPlaceholder,
  sanitizeCustomCss,
  sanitizeCustomHtml,
  scopeCss,
} from '@/lib/customSite';

const SCOPE = '[data-custom-site]';

export type EngagementModel = 'quote' | 'order' | 'booking' | 'ticket';

function buildWidgetElement(widgetId: string, engagementModel: EngagementModel = 'quote'): string {
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

function prepareInlineHtml(
  page: CustomPageArtifact,
  custom: CustomSiteConfig,
  widgetId: string,
  engagementModel: EngagementModel
): { html: string; css: string } {
  const widgetEl = buildWidgetElement(widgetId, engagementModel);
  const rawHtml = injectWidgetPlaceholder(page.html || '', widgetEl);
  const html = sanitizeCustomHtml(rawHtml);
  const combinedCss = [custom.globalCss || '', page.css || ''].filter(Boolean).join('\n');
  // Site CSS first, then mount reset so AI grey "outer boxes" cannot win.
  const css = [
    scopeCss(sanitizeCustomCss(combinedCss), SCOPE),
    scopeCss(WIDGET_MOUNT_RESET_CSS, SCOPE),
  ]
    .filter(Boolean)
    .join('\n');
  return { html, css };
}

function buildSrcDoc(
  page: CustomPageArtifact,
  custom: CustomSiteConfig,
  widgetId: string,
  engagementModel: EngagementModel
): string {
  const widgetEl = buildWidgetElement(widgetId, engagementModel);
  const bodyHtml = injectWidgetPlaceholder(page.html || '', widgetEl);
  // Iframe mode allows scripts (true "anything"); still strip javascript: URLs
  // from CSS and keep a basic document shell.
  const css = [
    sanitizeCustomCss([custom.globalCss || '', page.css || ''].filter(Boolean).join('\n')),
    WIDGET_MOUNT_RESET_CSS,
  ]
    .filter(Boolean)
    .join('\n');
  const title = page.title ? `<title>${escapeHtml(page.title)}</title>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>${title}<style>${css}</style></head><body>${bodyHtml}<script src="${WIDGET_CDN_URL}" defer></script></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders one page of a per-tenant custom site outside the shared template
 * engine. Default mode is inline (sanitized HTML + scoped CSS). Opt into
 * iframe mode when the build needs arbitrary JS.
 */
export default function CustomSiteRenderer({
  custom,
  page,
  widgetId,
  engagementModel = 'quote',
  isDraftPreview = false,
}: {
  custom: CustomSiteConfig;
  page: CustomPageArtifact;
  widgetId: string;
  /** Which engagement web component to mount at the widget placeholder. */
  engagementModel?: EngagementModel;
  isDraftPreview?: boolean;
}) {
  const mode = custom.mode === 'iframe' ? 'iframe' : 'inline';
  const model: EngagementModel =
    engagementModel === 'order' ||
    engagementModel === 'booking' ||
    engagementModel === 'ticket'
      ? engagementModel
      : 'quote';

  if (mode === 'iframe') {
    const srcDoc = buildSrcDoc(page, custom, widgetId, model);
    return (
      <div className="relative min-h-screen w-full">
        {isDraftPreview ? <DraftBanner /> : null}
        <iframe
          title={page.title || 'Custom site'}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          className="block w-full border-0"
          style={{ minHeight: '100vh', height: '100vh' }}
        />
      </div>
    );
  }

  const { html, css } = prepareInlineHtml(page, custom, widgetId, model);

  return (
    <div className="relative min-h-screen w-full">
      {isDraftPreview ? <DraftBanner /> : null}
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <div data-custom-site dangerouslySetInnerHTML={{ __html: html }} />
      <Script src={WIDGET_CDN_URL} strategy="lazyOnload" />
    </div>
  );
}

function DraftBanner() {
  return (
    <div className="sticky top-0 z-[9999] bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-black">
      DRAFT PREVIEW — not published. Publish from Admin → Sites to go live.
    </div>
  );
}
