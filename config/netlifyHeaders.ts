const apiOrigin = (apiBaseUrl: string | undefined): string => {
  if (apiBaseUrl === undefined || !URL.canParse(apiBaseUrl)) {
    throw new Error(`VITE_API_BASE_URL must be the absolute API URL, got "${apiBaseUrl}"`)
  }
  return new URL(apiBaseUrl).origin
}

/**
 * Netlify `_headers` file holding the CSP. It lives here and not in netlify.toml because the API
 * origin is only known at build time, from VITE_API_BASE_URL.
 */
export function netlifyHeaders(apiBaseUrl: string | undefined): string {
  const csp = [
    "default-src 'self'",
    `connect-src 'self' ${apiOrigin(apiBaseUrl)}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
  return `/*\n  Content-Security-Policy: ${csp}\n`
}
