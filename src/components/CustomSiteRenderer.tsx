'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import Script from 'next/script';
import { PUBLIC_API_URL, WIDGET_CDN_URL } from '@/lib/urls';
import type { CustomPageArtifact, CustomSiteConfig } from '@/lib/customSite';
import { htmlHasInjectableWidget } from '@/lib/customSite';
import {
  type EngagementModel,
  buildSrcDoc,
  prepareInlineHtml,
  renderedHtmlHasLiveWidget,
} from '@/lib/customSiteRender';
import EditInPlaceLayer from '@/components/EditInPlaceLayer';
import ContentEditorBridge from '@/components/ContentEditorBridge';

export type { EngagementModel } from '@/lib/customSiteRender';

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
  const editToken = keep.get('edit_token');
  if (!draft && !bypass && !editToken) return null;

  if (draft && !url.searchParams.has('draft')) url.searchParams.set('draft', draft);
  if (bypass && !url.searchParams.has('admin_bypass')) {
    url.searchParams.set('admin_bypass', bypass);
  }
  if (editToken && !url.searchParams.has('edit_token')) {
    url.searchParams.set('edit_token', editToken);
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
  editInPlace = false,
  tenantId = '',
  pagePath = '/',
  apiBaseUrl = PUBLIC_API_URL,
  editToken = null,
}: {
  custom: CustomSiteConfig;
  page: CustomPageArtifact;
  widgetId: string;
  /** Which engagement web component to mount at the widget placeholder. */
  engagementModel?: EngagementModel;
  isDraftPreview?: boolean;
  /** Query string (e.g. "draft=1&admin_bypass=…") appended to internal links. */
  previewQuery?: string | null;
  /** Admin bypass + site_configs.edit_in_place — show WYSIWYG chrome. */
  editInPlace?: boolean;
  tenantId?: string;
  pagePath?: string;
  apiBaseUrl?: string;
  editToken?: string | null;
}) {
  const mode = custom.mode === 'iframe' ? 'iframe' : 'inline';
  const model: EngagementModel =
    engagementModel === 'order' ||
    engagementModel === 'booking' ||
    engagementModel === 'ticket'
      ? engagementModel
      : 'quote';
  const rootRef = useRef<HTMLDivElement>(null);
  const siteRef = useRef<HTMLDivElement>(null);
  const showEditor = editInPlace && mode === 'inline' && Boolean(tenantId);
  const { html, css } = prepareInlineHtml(page, custom, widgetId, model, previewQuery);

  // Canary: the artifact had a widget mount but the composed HTML lost it —
  // the exact class of pipeline regression that once shipped widget-less sites.
  useEffect(() => {
    if (mode !== 'inline') return;
    if (htmlHasInjectableWidget(page.html || '') && !renderedHtmlHasLiveWidget(html)) {
      console.error(
        '[CustomSiteRenderer] engagement widget lost during render pipeline — artifact has a mount but rendered HTML has no <closet-*-widget>.',
        { pagePath, widgetId }
      );
    }
  }, [mode, page.html, html, pagePath, widgetId]);


  // In edit mode, seed the DOM once and never let React rewrite it via
  // dangerouslySetInnerHTML (that wiped contenteditable changes before Save).
  useLayoutEffect(() => {
    if (!showEditor) return;
    const el = siteRef.current;
    if (!el || el.dataset.eipSeeded === '1') return;
    el.innerHTML = html;
    el.dataset.eipSeeded = '1';
  }, [showEditor, html]);

  useEffect(() => {
    if (!isDraftPreview && !editInPlace) return;
    const root = rootRef.current;
    if (!root) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor || !root.contains(anchor)) return;
      // While a contenteditable field is active, don't hijack the click for nav.
      if ((event.target as HTMLElement | null)?.isContentEditable) {
        return;
      }
      const href = anchor.getAttribute('href');
      if (!href) return;
      const next = withCurrentPreviewParams(href, window.location.search);
      if (!next || next === href) return;
      event.preventDefault();
      window.location.assign(next);
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [isDraftPreview, editInPlace, page.html]);

  if (mode === 'iframe') {
    const srcDoc = buildSrcDoc(page, custom, widgetId, model, previewQuery);
    return (
      <div className="relative min-h-screen w-full" ref={rootRef}>
        <CustomSiteSkipLink />
        {isDraftPreview ? <DraftBanner /> : null}
        {editInPlace ? (
          <div className="sticky top-0 z-[10000] bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-black">
            Edit in place requires Inline mode (this site is iframe). Switch mode in Custom build.
          </div>
        ) : null}
        <iframe
          id="custom-site-content"
          tabIndex={-1}
          title={page.title || 'Custom site'}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-forms allow-popups"
          className="block w-full border-0"
          style={{ minHeight: '100vh', height: '100vh' }}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full" ref={rootRef}>
      <CustomSiteSkipLink />
      {showEditor ? (
        <EditInPlaceLayer
          siteRef={siteRef}
          tenantId={tenantId}
          pagePath={pagePath}
          apiBaseUrl={apiBaseUrl}
          editToken={editToken}
        />
      ) : isDraftPreview ? (
        <DraftBanner />
      ) : null}
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <ContentEditorBridge rootRef={siteRef} mode="custom" pagePath={pagePath} />
      {showEditor ? (
        <div
          data-custom-site
          id="custom-site-content"
          tabIndex={-1}
          className="overflow-x-clip"
          ref={siteRef}
        />
      ) : (
        <div
          data-custom-site
          id="custom-site-content"
          tabIndex={-1}
          className="overflow-x-clip"
          ref={siteRef}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      {/* afterInteractive: do not wait for window.load (blocked by many large
          gallery images). lazyOnload deferred the 450KB widget until every
          eager img finished — extending the main-thread hitch. */}
      <Script src={WIDGET_CDN_URL} strategy="afterInteractive" />
    </div>
  );
}

function CustomSiteSkipLink() {
  return (
    <a
      href="#custom-site-content"
      className="fixed left-4 top-4 z-[10001] -translate-y-24 bg-white px-4 py-3 text-sm font-semibold text-black shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
    >
      Skip to main content
    </a>
  );
}

function DraftBanner() {
  return (
    <div className="sticky top-0 z-[9999] bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-black">
      DRAFT PREVIEW — not published. Publish from Admin → Sites to go live.
    </div>
  );
}
