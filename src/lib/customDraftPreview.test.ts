import { describe, expect, it } from 'vitest'
import {
  buildCustomDraftPreviewQuery,
  shouldPaintCustomDraft,
} from './customDraftPreview'

describe('shouldPaintCustomDraft', () => {
  it('requires admin bypass', () => {
    expect(
      shouldPaintCustomDraft({
        isAdminBypass: false,
        draftParam: '1',
        draftPreviewCookie: 'true',
      })
    ).toBe(false)
  })

  it('requires explicit ?draft=1 (cookie alone is not enough)', () => {
    expect(
      shouldPaintCustomDraft({
        isAdminBypass: true,
        draftParam: '1',
        draftPreviewCookie: null,
      })
    ).toBe(true)
    expect(
      shouldPaintCustomDraft({
        isAdminBypass: true,
        draftParam: undefined,
        draftPreviewCookie: 'true',
      })
    ).toBe(false)
  })
})

describe('buildCustomDraftPreviewQuery', () => {
  it('always includes draft=1 and optional admin_bypass', () => {
    expect(buildCustomDraftPreviewQuery({})).toBe('draft=1')
    expect(buildCustomDraftPreviewQuery({ adminBypassParam: 'secret' })).toBe(
      'draft=1&admin_bypass=secret'
    )
  })
})
