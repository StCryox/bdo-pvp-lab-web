import { queryOptions, useMutation } from '@tanstack/react-query'
import { useApiClient } from './apiContext'
import { type ApiClient, unwrap } from './client'
import type { components, operations } from './schema'

export type DamageEstimateRequest = components['schemas']['DamageEstimateRequest']
export type IssueFilters = NonNullable<operations['listDataQualityIssues']['parameters']['query']>

export const healthQuery = (client: ApiClient) =>
  queryOptions({
    queryKey: ['health'],
    queryFn: () => unwrap(client.GET('/api/v1/health')),
  })

export const metaQuery = (client: ApiClient) =>
  queryOptions({
    queryKey: ['meta'],
    queryFn: () => unwrap(client.GET('/api/v1/meta')),
  })

export const classesQuery = (client: ApiClient) =>
  queryOptions({
    queryKey: ['classes'],
    queryFn: () => unwrap(client.GET('/api/v1/classes')),
  })

export const classSkillsQuery = (client: ApiClient, classSlug: string, spec: string | undefined) =>
  queryOptions({
    queryKey: ['classes', classSlug, 'skills', { spec }],
    queryFn: () =>
      unwrap(
        client.GET('/api/v1/classes/{class_slug}/skills', {
          params: { path: { class_slug: classSlug }, query: { spec } },
        }),
      ),
  })

export const skillQuery = (client: ApiClient, classSlug: string, skillId: number) =>
  queryOptions({
    queryKey: ['classes', classSlug, 'skills', skillId],
    queryFn: () =>
      unwrap(
        client.GET('/api/v1/classes/{class_slug}/skills/{skill_id}', {
          params: { path: { class_slug: classSlug, skill_id: skillId } },
        }),
      ),
  })

export const dataQualityQuery = (client: ApiClient) =>
  queryOptions({
    queryKey: ['data-quality'],
    queryFn: () => unwrap(client.GET('/api/v1/data-quality')),
  })

export const dataQualityIssuesQuery = (client: ApiClient, filters: IssueFilters) =>
  queryOptions({
    queryKey: ['data-quality', 'issues', filters],
    queryFn: () =>
      unwrap(client.GET('/api/v1/data-quality/issues', { params: { query: filters } })),
  })

// One estimate per skill of a table: the result only depends on the body, and a
// 4xx (skill without damage) would not succeed on retry.
export const damageEstimateQuery = (client: ApiClient, body: DamageEstimateRequest) =>
  queryOptions({
    queryKey: ['damage-estimate', body],
    queryFn: () => unwrap(client.POST('/api/v1/damage/estimate', { body })),
    staleTime: Infinity,
    retry: false,
  })

export function useEstimateDamage() {
  const client = useApiClient()
  return useMutation({
    mutationFn: (body: DamageEstimateRequest) =>
      unwrap(client.POST('/api/v1/damage/estimate', { body })),
  })
}
