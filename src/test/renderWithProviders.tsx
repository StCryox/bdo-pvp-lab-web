import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { type RouteObject, createMemoryRouter } from 'react-router'
import App from '../App'
import { createApiClient } from '../api/client'
import { FAKE_API_BASE_URL, type FakeResponseOverride, createFakeFetch } from './fakeFetch'

interface RenderRoutesOptions {
  route?: string
  overrides?: FakeResponseOverride[]
}

interface RenderOptions extends RenderRoutesOptions {
  path?: string
}

export function renderRoutes(
  routes: RouteObject[],
  { route = '/', overrides = [] }: RenderRoutesOptions = {},
) {
  const { fetch, requests } = createFakeFetch(overrides)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [route] })

  const user = userEvent.setup()
  const result = render(
    <App
      queryClient={queryClient}
      apiClient={createApiClient(FAKE_API_BASE_URL, fetch)}
      router={router}
    />,
  )

  return { ...result, router, requests, user }
}

export function renderWithProviders(
  element: ReactElement,
  { path = '/', ...options }: RenderOptions = {},
) {
  return renderRoutes(
    [
      { path, element },
      { path: '*', element: null },
    ],
    options,
  )
}
