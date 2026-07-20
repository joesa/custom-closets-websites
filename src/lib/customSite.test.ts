import { describe, expect, it } from 'vitest'
import {
  getCustomPage,
  normalizeCustomPath,
  scopeCss,
  sanitizeCustomCss,
  validateCustomConfig,
  WIDGET_PLACEHOLDER,
  type CustomSiteConfig,
} from './customSite'

describe('normalizeCustomPath', () => {
  it('normalizes variants to /slug', () => {
    expect(normalizeCustomPath('/')).toBe('/')
    expect(normalizeCustomPath('')).toBe('/')
    expect(normalizeCustomPath('services')).toBe('/services')
    expect(normalizeCustomPath('/services/')).toBe('/services')
  })
})

describe('getCustomPage', () => {
  const cfg: CustomSiteConfig = {
    mode: 'inline',
    pages: {
      '/': { html: '<h1>Home</h1>' },
      '/about': { html: '<h1>About</h1>' },
    },
  }
  it('finds pages by path', () => {
    expect(getCustomPage(cfg, '/')?.html).toContain('Home')
    expect(getCustomPage(cfg, '/about')?.html).toContain('About')
    expect(getCustomPage(cfg, '/missing')).toBeNull()
  })
})

describe('scopeCss', () => {
  it('prefixes selectors with the scope', () => {
    const out = scopeCss('h1 { color: red; } .card { padding: 1rem; }', '[data-custom-site]')
    expect(out).toContain('[data-custom-site] h1')
    expect(out).toContain('[data-custom-site] .card')
  })

  it('scopes body/html/:root to the wrapper', () => {
    const out = scopeCss('body { margin: 0; }', '[data-custom-site]')
    expect(out).toContain('[data-custom-site]{')
    expect(out).not.toMatch(/(^|[,{])\s*body\s*\{/)
  })

  it('scopes inside @media', () => {
    const out = scopeCss('@media (max-width: 600px) { .x { display: none; } }', '[data-custom-site]')
    expect(out).toContain('@media')
    expect(out).toContain('[data-custom-site] .x')
  })
})

describe('sanitizeCustomCss', () => {
  it('strips @import and javascript urls', () => {
    const out = sanitizeCustomCss("@import url('evil.css'); a { background: url(javascript:alert(1)); }")
    expect(out).not.toMatch(/@import/i)
    expect(out).not.toMatch(/javascript:/i)
  })
})

describe('validateCustomConfig', () => {
  it('requires pages and hard-fails without widget on home', () => {
    const empty = validateCustomConfig({ mode: 'inline', pages: {} })
    expect(empty.ok).toBe(false)

    const noWidget = validateCustomConfig({
      mode: 'inline',
      pages: { '/': { html: '<h1>Hi</h1>' } },
    })
    expect(noWidget.ok).toBe(false)
    expect(noWidget.errors.some((e) => /widget/i.test(e))).toBe(true)

    const withWidget = validateCustomConfig({
      mode: 'inline',
      pages: { '/': { html: `<div>${WIDGET_PLACEHOLDER}</div>` } },
    })
    expect(withWidget.ok).toBe(true)
    expect(withWidget.errors).toHaveLength(0)
  })

  it('normalizes mutated CLOSET_WIDGET comments for inject', async () => {
    const { injectWidgetPlaceholder, normalizeWidgetPlaceholders } = await import(
      './customSite'
    )
    const raw = `<div class="widget-container"><!-- CLOSET_WIDGET theme="dark" --></div>`
    const normalized = normalizeWidgetPlaceholders(raw)
    expect(normalized).toContain(WIDGET_PLACEHOLDER)
    const injected = injectWidgetPlaceholder(raw, '<closet-quote-widget></closet-quote-widget>')
    expect(injected).toContain('closet-quote-widget')
    expect(injected).not.toMatch(/theme="dark"/)
  })

  it('unwraps decorative widget-container shells after inject', async () => {
    const { injectWidgetPlaceholder } = await import('./customSite')
    const raw = `<div class="widget-container">${WIDGET_PLACEHOLDER}</div>`
    const injected = injectWidgetPlaceholder(raw, '<closet-quote-widget data-x="1"></closet-quote-widget>')
    expect(injected).toContain('closet-widget-mount')
    expect(injected).not.toMatch(/widget-container/)
    expect(injected).toContain('<closet-quote-widget data-x="1"></closet-quote-widget>')
  })

  it('errors on script in inline mode', () => {
    const r = validateCustomConfig({
      mode: 'inline',
      pages: { '/': { html: `<script>alert(1)</script>${WIDGET_PLACEHOLDER}` } },
    })
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => /script/i.test(e))).toBe(true)
  })
})
