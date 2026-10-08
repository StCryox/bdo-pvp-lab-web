import createClient, { type Client } from 'openapi-fetch'
import type { components, paths } from './schema'

export type ApiClient = Client<paths>
export type Problem = components['schemas']['Problem']

export function createApiClient(
  baseUrl: string,
  fetchFn: typeof fetch = globalThis.fetch,
): ApiClient {
  return createClient<paths>({ baseUrl, fetch: fetchFn })
}

export class ApiError extends Error {
  readonly problem: Problem

  constructor(problem: Problem) {
    super(problem.title)
    this.name = 'ApiError'
    this.problem = problem
  }
}

interface FetchResult<T> {
  data?: T
  error?: unknown
  response: Response
}

const isProblem = (value: unknown): value is Problem =>
  typeof value === 'object' && value !== null && 'title' in value && 'status' in value

export async function unwrap<T>(request: Promise<FetchResult<T>>): Promise<T> {
  const { data, error, response } = await request
  if (response.ok && data !== undefined) return data
  throw new ApiError(
    isProblem(error)
      ? error
      : {
          type: 'about:blank',
          title: response.statusText || 'Request failed',
          status: response.status,
        },
  )
}
