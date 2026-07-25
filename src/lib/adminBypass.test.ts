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
})
