import { describe, it, expect } from 'vitest'
import {
  buildSrcDoc,
  buildWidgetElement,
  prepareInlineHtml,
  renderedHtmlHasLiveWidget,
} from './customSiteRender'
import { sanitizeCustomHtml, injectWidgetPlaceholder, WIDGET_PLACEHOLDER } from './customSite'
import type { CustomPageArtifact, CustomSiteConfig } from './customSite'

const page: CustomPageArtifact = {
  html: `
    <header><a href="/">Acme Wraps</a><a href="/contact">Contact</a></header>
    <section><h1>Vehicle wraps done right</h1></section>
    <section class="quote">
      <h2>Get an instant estimate</h2>
      ${WIDGET_PLACEHOLDER}
    </section>
    <script>alert('xss')</script>
    <button onclick="steal()">Click</button>
  `,
  css: 'h1{color:red}',
  title: 'Acme <Wraps>',
}

const custom: CustomSiteConfig = {
  mode: 'inline',
  globalCss: ':root{--acc:#2f5d50}',
  pages: { '/': page },
}

describe('custom site render pipeline (sanitize first, inject widget last)', () => {
  it('mounts a live widget element in inline mode', () => {
    const { html } = prepareInlineHtml(page, custom, 'w-123', 'quote')
    expect(html).toMatch(/<closet-quote-widget\b[^>]*data-contractor-id="w-123"/)
    expect(html).not.toContain(WIDGET_PLACEHOLDER)
    expect(renderedHtmlHasLiveWidget(html)).toBe(true)
  })

  it('still strips scripts and event handlers', () => {
    const { html } = prepareInlineHtml(page, custom, 'w-123', 'quote')
    expect(html).not.toMatch(/<script\b/i)
    expect(html).not.toMatch(/onclick=/i)
  })

  it('mounts the engagement-model-specific widget', () => {
    for (const [model, tag] of [
      ['order', 'closet-order-widget'],
      ['booking', 'closet-booking-widget'],
      ['ticket', 'closet-ticket-widget'],
    ] as const) {
      const { html } = prepareInlineHtml(page, custom, 'w-123', model)
      expect(html).toContain(`<${tag} data-contractor-id="w-123"`)
    }
  })

  it('mounts a live widget element in iframe (srcDoc) mode', () => {
    const doc = buildSrcDoc(page, custom, 'w-123', 'quote')
    expect(doc).toMatch(/<closet-quote-widget\b[^>]*data-contractor-id="w-123"/)
    expect(doc).not.toContain(WIDGET_PLACEHOLDER)
  })

  it('keeps preview query propagation on internal links after injection', () => {
    const { html } = prepareInlineHtml(page, custom, 'w-123', 'quote', 'draft=1')
    expect(html).toContain('href="/contact?draft=1"')
  })

  it('regression: sanitizing AFTER injection would remove the widget (the shipped bug)', () => {
    // Documents WHY the order is load-bearing: sanitize normalizes live widget
    // tags back into the inert placeholder comment.
    const injectedFirst = sanitizeCustomHtml(
      injectWidgetPlaceholder(page.html || '', buildWidgetElement('w-123', 'quote'))
    )
    expect(injectedFirst).not.toMatch(/<closet-quote-widget\b/)
    expect(injectedFirst).toContain(WIDGET_PLACEHOLDER)
  })
})
