import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { ApiProvider } from '../api/ApiProvider'
import { createApiClient } from '../api/client'
import { FAKE_API_BASE_URL, type FakeResponseOverride, createFakeFetch } from './fakeFetch'

interface RenderOptions {
  path?: string
  route?: string
  overrides?: FakeResponseOverride[]
}

export function renderWithProviders(
  element: ReactElement,
  { path = '/', route = '/', overrides = [] }: RenderOptions = {},
) {
  const { fetch, requests } = createFakeFetch(overrides)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [
      { path, element },
      { path: '*', element: null },
    ],
    { initialEntries: [route] },
  )

  const user = userEvent.setup()
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ApiProvider client={createApiClient(FAKE_API_BASE_URL, fetch)}>
        <RouterProvider router={router} />
      </ApiProvider>
    </QueryClientProvider>,
  )

  return { ...result, router, requests, user }
}
