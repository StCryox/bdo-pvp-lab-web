export const FAKE_API_BASE_URL = 'http://api.test'

interface JsonPathPattern {
  matchesJsonPath: { expression: string; equalTo: string }
}

export interface WireMockMapping {
  priority: number
  request: {
    method: string
    urlPath?: string
    urlPathPattern?: string
    queryParameters?: Record<string, { equalTo: string }>
    bodyPatterns?: JsonPathPattern[]
  }
  response: { status: number; headers: Record<string, string>; bodyFileName: string }
  metadata: { operationId: string }
}

export interface FakeResponseOverride {
  method: string
  path: string
  status: number
  body: unknown
}

const fixtures = import.meta.glob<unknown>('./fixtures/*.json', { eager: true, import: 'default' })
const mappings = Object.values(
  import.meta.glob<WireMockMapping>('../../wiremock/mappings/*.json', {
    eager: true,
    import: 'default',
  }),
).sort((a, b) => a.priority - b.priority)

const valueAt = (body: unknown, expression: string): unknown =>
  expression
    .replace(/^\$\./, '')
    .split('.')
    .reduce<unknown>(
      (node, key) =>
        typeof node === 'object' && node !== null
          ? (node as Record<string, unknown>)[key]
          : undefined,
      body,
    )

const matches = (mapping: WireMockMapping, method: string, url: URL, body: unknown): boolean => {
  const { request } = mapping
  if (request.method !== method) return false
  if (request.urlPath !== undefined && request.urlPath !== url.pathname) return false
  if (
    request.urlPathPattern !== undefined &&
    !new RegExp(`^${request.urlPathPattern}$`).test(url.pathname)
  ) {
    return false
  }
  const queryMatches = Object.entries(request.queryParameters ?? {}).every(
    ([name, { equalTo }]) => url.searchParams.get(name) === equalTo,
  )
  const bodyMatches = (request.bodyPatterns ?? []).every(
    ({ matchesJsonPath: { expression, equalTo } }) => String(valueAt(body, expression)) === equalTo,
  )
  return queryMatches && bodyMatches
}

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  })

export function createFakeFetch(overrides: FakeResponseOverride[] = []) {
  const requests: Request[] = []

  const fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init)
    requests.push(request.clone())
    const url = new URL(request.url)
    const body: unknown = request.method === 'GET' ? undefined : await request.json()

    const override = overrides.find((o) => o.method === request.method && o.path === url.pathname)
    if (override) return jsonResponse(override.status, override.body)

    const mapping = mappings.find((m) => matches(m, request.method, url, body))
    if (!mapping) throw new Error(`No fake response for ${request.method} ${url.pathname}`)
    return jsonResponse(
      mapping.response.status,
      fixtures[`./fixtures/${mapping.response.bodyFileName}`],
    )
  }

  return { fetch, requests }
}
