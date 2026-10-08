import { describe, expect, it } from 'vitest'
import { FAKE_API_BASE_URL, createFakeFetch } from './fakeFetch'

const get = (fetchFn: typeof fetch, path: string) =>
  fetchFn(new Request(`${FAKE_API_BASE_URL}${path}`))

const post = (fetchFn: typeof fetch, path: string, body: unknown) =>
  fetchFn(
    new Request(`${FAKE_API_BASE_URL}${path}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  )

describe('createFakeFetch', () => {
  it('serves the fixture of the matching WireMock mapping', async () => {
    const { fetch } = createFakeFetch()

    const response = await get(fetch, '/api/v1/classes')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(await response.json()).toContainEqual(expect.objectContaining({ class_slug: 'mystic' }))
  })

  it('prefers the mapping with the matching query parameter', async () => {
    const { fetch } = createFakeFetch()

    const skills = (await (
      await get(fetch, '/api/v1/classes/mystic/skills?spec=Succession')
    ).json()) as { specs: string[] }[]

    expect(skills.every((s) => s.specs.includes('Succession'))).toBe(true)
  })

  it('falls back to the url pattern mapping with its problem status', async () => {
    const { fetch } = createFakeFetch()

    const response = await get(fetch, '/api/v1/classes/mystic/skills/9999')

    expect(response.status).toBe(404)
    expect(response.headers.get('Content-Type')).toBe('application/problem+json')
    expect(await response.json()).toMatchObject({ title: 'Skill not found' })
  })

  it('matches POST mappings on the JSON body', async () => {
    const { fetch } = createFakeFetch()

    const ok = await post(fetch, '/api/v1/damage/estimate', {
      class_slug: 'mystic',
      skill_id: 2786,
    })
    const notEstimable = await post(fetch, '/api/v1/damage/estimate', {
      class_slug: 'mystic',
      skill_id: 2722,
    })

    expect(await ok.json()).toMatchObject({ total_expected_hp_loss: 2706.32 })
    expect(notEstimable.status).toBe(422)
  })

  it('serves an override before the mappings', async () => {
    const { fetch } = createFakeFetch([
      { method: 'GET', path: '/api/v1/meta', status: 500, body: { title: 'Boom', status: 500 } },
    ])

    const response = await get(fetch, '/api/v1/meta')

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ title: 'Boom', status: 500 })
  })

  it('records the requests it receives', async () => {
    const { fetch, requests } = createFakeFetch()

    await get(fetch, '/api/v1/data-quality/issues?severity=error')

    expect(requests.map((r) => r.url)).toEqual([
      `${FAKE_API_BASE_URL}/api/v1/data-quality/issues?severity=error`,
    ])
  })

  it('fails the test on an unmapped request', async () => {
    const { fetch } = createFakeFetch()

    await expect(get(fetch, '/api/v2/unknown')).rejects.toThrow(/No fake response for GET/)
  })
})
