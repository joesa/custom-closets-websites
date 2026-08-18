import { describe, expect, it } from 'vitest'
import { isAdminBypassRequest } from './adminBypass'

describe('isAdminBypassRequest', () => {
  it('accepts the bypass cookie', () => {
    expect(
      isAdminBypassRequest({
        cookieValue: 'true',
        queryValue: null,
        secret: 's3cret',
      })
    ).toBe(true)
  })

  it('accepts a matching query secret on the same request', () => {
    expect(
      isAdminBypassRequest({
        cookieValue: null,
        queryValue: 's3cret',
        secret: 's3cret',
      })
    ).toBe(true)
  })

  it('rejects mismatched or missing secrets', () => {
    expect(
      isAdminBypassRequest({
        cookieValue: null,
        queryValue: 'wrong',
        secret: 's3cret',
      })
    ).toBe(false)
    expect(
      isAdminBypassRequest({
        cookieValue: null,
        queryValue: 's3cret',
        secret: '',
      })
    ).toBe(false)
  })

  it('refuses the published default when no secret is configured', () => {
    // A deployment missing ADMIN_BYPASS_SECRET used to accept this literal,
    // which unlocked every gated tenant site to anyone who read the source.
    for (const secret of [undefined, null, '', '   ']) {
      expect(
        isAdminBypassRequest({
          cookieValue: null,
          queryValue: 'admin_bypass_default_secret',
          secret,
        }),
        `secret=${JSON.stringify(secret)}`
      ).toBe(false)
    }
  })
})
