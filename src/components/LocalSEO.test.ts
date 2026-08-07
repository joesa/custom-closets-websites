import { describe, expect, it } from 'vitest'
import { serializeJsonLd } from './LocalSEO'

describe('serializeJsonLd', () => {
  it('cannot be terminated by user-controlled SEO text', () => {
    const output = serializeJsonLd({ name: '</script><script>alert(1)</script>' })
    expect(output).not.toContain('</script>')
    expect(output).not.toContain('<script>')
    expect(JSON.parse(output).name).toBe('</script><script>alert(1)</script>')
  })
})
