import { describe, expect, it } from 'vitest'
import { netlifyHeaders } from './netlifyHeaders.ts'

const cspOf = (headers: string): string => headers.match(/Content-Security-Policy: (.*)/)?.[1] ?? ''

describe('netlifyHeaders', () => {
  it('applies the content security policy to every path', () => {
    expect(netlifyHeaders('https://api.example.org').split('\n')[0]).toBe('/*')
  })

  it('lets the app call only itself and the API origin', () => {
    const csp = cspOf(netlifyHeaders('https://api.example.org/some/path'))

    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("connect-src 'self' https://api.example.org;")
    expect(csp).toContain("frame-ancestors 'none'")
  })

  it('refuses to build without an API URL', () => {
    expect(() => netlifyHeaders(undefined)).toThrow('VITE_API_BASE_URL')
    expect(() => netlifyHeaders('not a url')).toThrow('VITE_API_BASE_URL')
  })
})
