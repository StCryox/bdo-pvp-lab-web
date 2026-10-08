import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { ApiProvider } from './ApiProvider'
import { useApiClient } from './apiContext'
import { createApiClient } from './client'

describe('ApiProvider', () => {
  it('provides the client to useApiClient', () => {
    const client = createApiClient('http://api.test')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ApiProvider client={client}>{children}</ApiProvider>
    )

    const { result } = renderHook(() => useApiClient(), { wrapper })

    expect(result.current).toBe(client)
  })

  it('fails loudly when useApiClient is used outside the provider', () => {
    expect(() => renderHook(() => useApiClient())).toThrow(/ApiProvider/)
  })
})
