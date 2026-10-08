import { describe, expect, it, vi } from 'vitest'
import { ApiError, createApiClient, unwrap } from './client'

const jsonResponse = (body: unknown, status = 200, contentType = 'application/json'): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })

describe('createApiClient', () => {
  it('sends requests to the base url with the given fetch', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse([]))
    const client = createApiClient('http://api.test', fetchFn)

    await client.GET('/api/v1/classes')

    const request = fetchFn.mock.calls[0]?.[0] as Request
    expect(request.url).toBe('http://api.test/api/v1/classes')
  })
})

describe('unwrap', () => {
  it('returns the data of a successful response', async () => {
    const client = createApiClient('http://api.test', () =>
      Promise.resolve(jsonResponse([{ class_slug: 'mystic' }])),
    )

    const classes = await unwrap(client.GET('/api/v1/classes'))

    expect(classes).toEqual([{ class_slug: 'mystic' }])
  })

  it('throws an ApiError carrying the problem details of an error response', async () => {
    const problem = {
      type: 'https://bdo-pvp-lab.local/problems/skill-not-found',
      title: 'Skill not found',
      status: 404,
      detail: 'No skill 9999 for class mystic',
    }
    const client = createApiClient('http://api.test', () =>
      Promise.resolve(jsonResponse(problem, 404, 'application/problem+json')),
    )

    const result = unwrap(
      client.GET('/api/v1/classes/{class_slug}/skills/{skill_id}', {
        params: { path: { class_slug: 'mystic', skill_id: 9999 } },
      }),
    )

    await expect(result).rejects.toBeInstanceOf(ApiError)
    await expect(result).rejects.toMatchObject({ message: 'Skill not found', problem })
  })

  it('builds a problem from the status when the error body is not a problem', async () => {
    const client = createApiClient('http://api.test', () =>
      Promise.resolve(new Response('boom', { status: 500, statusText: 'Internal Server Error' })),
    )

    const result = unwrap(client.GET('/api/v1/classes'))

    await expect(result).rejects.toMatchObject({
      problem: { type: 'about:blank', title: 'Internal Server Error', status: 500 },
    })
  })
})
