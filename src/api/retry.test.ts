import { describe, expect, it } from 'vitest'
import { ApiError } from './client'
import { retryNetworkErrors } from './retry'

const notFound = new ApiError({ type: 'about:blank', title: 'Skill not found', status: 404 })
const networkError = new TypeError('Failed to fetch')

describe('retryNetworkErrors', () => {
  it('retries a network error twice', () => {
    expect([0, 1, 2].map((failureCount) => retryNetworkErrors(failureCount, networkError))).toEqual(
      [true, true, false],
    )
  })

  it('never retries a problem returned by the API', () => {
    expect(retryNetworkErrors(0, notFound)).toBe(false)
  })
})
