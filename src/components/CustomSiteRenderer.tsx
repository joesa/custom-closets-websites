'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { PUBLIC_API_URL, WIDGET_CDN_URL } from '@/lib/urls';
import {
  type CustomPageArtifact,
  type CustomSiteConfig,
  WIDGET_MOUNT_RESET_CSS,
  appendPreviewQueryToInternalLinks,
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
  engagementModel: EngagementModel,
  previewQuery?: string | null
): { html: string; css: string } {
  const widgetEl = buildWidgetElement(widgetId, engagementModel);
  const rawHtml = injectWidgetPlaceholder(page.html || '', widgetEl);
  let html = sanitizeCustomHtml(rawHtml);
  if (previewQuery) {
    html = appendPreviewQueryToInternalLinks(html, previewQuery);
  }
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
  engagementModel: EngagementModel,
  previewQuery?: string | null
): string {
  const widgetEl = buildWidgetElement(widgetId, engagementModel);
  // Still sanitize HTML even in iframe mode — sandbox is not a substitute
  // for stripping script/event-handler payloads from AI/admin content.
  let bodyHtml = sanitizeCustomHtml(injectWidgetPlaceholder(page.html || '', widgetEl));
  if (previewQuery) {
    bodyHtml = appendPreviewQueryToInternalLinks(bodyHtml, previewQuery);
  }
  const css = [
    sanitizeCustomCss([custom.globalCss || '', page.css || ''].filter(Boolean).join('\n')),
    WIDGET_MOUNT_RESET_CSS,
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

/** Keep draft/admin preview params on in-site navigations (click safety net). */
function withCurrentPreviewParams(href: string, search: string): string | null {
  if (!href || !search) return null;
  if (
    href.startsWith('#') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('javascript:')
  ) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(href, window.location.origin);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;

  const keep = new URLSearchParams(search);
  const draft = keep.get('draft');
  const bypass = keep.get('admin_bypass');
  if (!draft && !bypass) return null;

  if (draft && !url.searchParams.has('draft')) url.searchParams.set('draft', draft);
  if (bypass && !url.searchParams.has('admin_bypass')) {
    url.searchParams.set('admin_bypass', bypass);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Renders one page of a per-tenant custom site outside the shared template
 * engine. Default / preferred mode is `inline` (sanitized HTML + scoped CSS).
 * `iframe` is elevated-trust only — body HTML is still sanitized; sandbox
 * does NOT combine allow-scripts with allow-same-origin.
 */
export default function CustomSiteRenderer({
  custom,
  page,
  widgetId,
  engagementModel = 'quote',
  isDraftPreview = false,
  previewQuery = null,
}: {
  custom: CustomSiteConfig;
  page: CustomPageArtifact;
  widgetId: string;
  /** Which engagement web component to mount at the widget placeholder. */
  engagementModel?: EngagementModel;
  isDraftPreview?: boolean;
  /** Query string (e.g. "draft=1&admin_bypass=…") appended to internal links. */
  previewQuery?: string | null;
}) {
  const mode = custom.mode === 'iframe' ? 'iframe' : 'inline';
  const model: EngagementModel =
    engagementModel === 'order' ||
    engagementModel === 'booking' ||
    engagementModel === 'ticket'
      ? engagementModel
      : 'quote';
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDraftPreview) return;
    const root = rootRef.current;
    if (!root) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor || !root.contains(anchor)) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      const next = withCurrentPreviewParams(href, window.location.search);
      if (!next || next === href) return;
      event.preventDefault();
      window.location.assign(next);
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [isDraftPreview, page.html]);

  if (mode === 'iframe') {
    const srcDoc = buildSrcDoc(page, custom, widgetId, model, previewQuery);
    return (
      <div className="relative min-h-screen w-full" ref={rootRef}>
        {isDraftPreview ? <DraftBanner /> : null}
        <iframe
          title={page.title || 'Custom site'}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-forms allow-popups"
          className="block w-full border-0"
          style={{ minHeight: '100vh', height: '100vh' }}
        />
      </div>
    );
  }

  const { html, css } = prepareInlineHtml(page, custom, widgetId, model, previewQuery);

  return (
    <div className="relative min-h-screen w-full" ref={rootRef}>
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
