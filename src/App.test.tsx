import { QueryClient, useQuery } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App'
import { useApiClient } from './api/apiContext'
import { createApiClient } from './api/client'
import { metaQuery } from './api/queries'
import { FAKE_API_BASE_URL, createFakeFetch } from './test/fakeFetch'

function ExtractId() {
  const { data } = useQuery(metaQuery(useApiClient()))
  return <p>{data?.extract_id ?? 'loading'}</p>
}

describe('App', () => {
  it('renders the router with the API client and query client it receives', async () => {
    const router = createMemoryRouter([{ path: '/', element: <ExtractId /> }])
    const apiClient = createApiClient(FAKE_API_BASE_URL, createFakeFetch().fetch)

    render(<App queryClient={new QueryClient()} apiClient={apiClient} router={router} />)

    expect(await screen.findByText('2026-09-30')).toBeInTheDocument()
  })
})
