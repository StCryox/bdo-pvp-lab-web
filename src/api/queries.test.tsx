import {
  type FetchQueryOptions,
  QueryClient,
  QueryClientProvider,
  type QueryKey,
} from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ApiProvider } from './ApiProvider'
import { type ApiClient, createApiClient } from './client'
import {
  classSkillsQuery,
  classesQuery,
  damageEstimateQuery,
  dataQualityIssuesQuery,
  dataQualityQuery,
  healthQuery,
  metaQuery,
  skillQuery,
  useEstimateDamage,
} from './queries'

const recordingClient = () => {
  const requests: Request[] = []
  const fetchFn = vi.fn<typeof fetch>((input) => {
    requests.push(input as Request)
    return Promise.resolve(
      new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })
  return { client: createApiClient('http://api.test', fetchFn), requests }
}

const requestedUrl = async <TData, TKey extends QueryKey>(
  build: (client: ApiClient) => FetchQueryOptions<TData, Error, TData, TKey>,
): Promise<string> => {
  const { client, requests } = recordingClient()
  await new QueryClient().fetchQuery(build(client))
  return requests[0]?.url ?? ''
}

const estimateBody = {
  class_slug: 'mystic',
  skill_id: 2786,
  variant: 1,
  attacker: {
    ap: 1085,
    accuracy: 1353,
    crit_rate_bonus: 0,
    crit_damage_bonus: 0.2,
    back_attack_bonus: 0,
    down_attack_bonus: 0,
    air_attack_bonus: 0,
  },
  defender: { dr: 740, evasion: 1197, super_armor_dr_rate: 0.1 },
  situation: {
    target_state: 'downed' as const,
    from_behind: false,
    target_in_super_armor: false,
    pvp_modifier: 1,
  },
}

describe('query options', () => {
  it('getHealth requests the health endpoint', async () => {
    expect(await requestedUrl(healthQuery)).toBe('http://api.test/api/v1/health')
  })

  it('getMeta requests the meta endpoint', async () => {
    expect(await requestedUrl(metaQuery)).toBe('http://api.test/api/v1/meta')
  })

  it('listClasses requests the classes endpoint', async () => {
    expect(await requestedUrl(classesQuery)).toBe('http://api.test/api/v1/classes')
  })

  it('getDataQuality requests the data-quality endpoint', async () => {
    expect(await requestedUrl(dataQualityQuery)).toBe('http://api.test/api/v1/data-quality')
  })

  it('listClassSkills requests the class skills filtered by spec', async () => {
    const url = await requestedUrl((client) => classSkillsQuery(client, 'mystic', 'Awakening'))

    expect(url).toBe('http://api.test/api/v1/classes/mystic/skills?spec=Awakening')
  })

  it('listClassSkills omits the spec when none is selected', async () => {
    const url = await requestedUrl((client) => classSkillsQuery(client, 'mystic', undefined))

    expect(url).toBe('http://api.test/api/v1/classes/mystic/skills')
  })

  it('getSkill requests the skill of the class', async () => {
    const url = await requestedUrl((client) => skillQuery(client, 'mystic', 2786))

    expect(url).toBe('http://api.test/api/v1/classes/mystic/skills/2786')
  })

  it('listDataQualityIssues passes filters and pagination as query parameters', async () => {
    const url = await requestedUrl((client) =>
      dataQualityIssuesQuery(client, { severity: 'warning', class_slug: 'mystic', offset: 50 }),
    )

    expect(url).toBe(
      'http://api.test/api/v1/data-quality/issues?severity=warning&class_slug=mystic&offset=50',
    )
  })

  it('uses distinct query keys for distinct parameters', () => {
    const { client } = recordingClient()

    expect(skillQuery(client, 'mystic', 2786).queryKey).not.toEqual(
      skillQuery(client, 'mystic', 2787).queryKey,
    )
    expect(classSkillsQuery(client, 'mystic', 'Awakening').queryKey).not.toEqual(
      classSkillsQuery(client, 'mystic', 'Succession').queryKey,
    )
  })
})

describe('damageEstimateQuery', () => {
  it('posts the estimate request', async () => {
    const { client, requests } = recordingClient()

    await new QueryClient().fetchQuery(damageEstimateQuery(client, estimateBody))

    expect(requests[0]?.method).toBe('POST')
    expect(requests[0]?.url).toBe('http://api.test/api/v1/damage/estimate')
    expect(await requests[0]?.json()).toEqual(estimateBody)
  })

  it('uses distinct query keys for distinct skills', () => {
    const { client } = recordingClient()

    expect(damageEstimateQuery(client, estimateBody).queryKey).not.toEqual(
      damageEstimateQuery(client, { ...estimateBody, skill_id: 2794 }).queryKey,
    )
  })
})

describe('useEstimateDamage', () => {
  it('posts the estimate request', async () => {
    const { client, requests } = recordingClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={new QueryClient()}>
        <ApiProvider client={client}>{children}</ApiProvider>
      </QueryClientProvider>
    )
    const { result } = renderHook(() => useEstimateDamage(), { wrapper })

    result.current.mutate(estimateBody)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(requests[0]?.method).toBe('POST')
    expect(requests[0]?.url).toBe('http://api.test/api/v1/damage/estimate')
    expect(await requests[0]?.json()).toEqual(estimateBody)
  })
})
