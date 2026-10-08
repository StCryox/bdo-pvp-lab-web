import { useQuery } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { useParams } from 'react-router'
import { describe, expect, it } from 'vitest'
import { useApiClient } from '../api/apiContext'
import { classesQuery } from '../api/queries'
import { renderRoutes, renderWithProviders } from './renderWithProviders'

function ClassCount() {
  const { data, error } = useQuery(classesQuery(useApiClient()))
  if (error) return <p>{error.message}</p>
  return <p>{data ? `${data.length} classes` : 'loading'}</p>
}

function SlugEcho() {
  return <p>slug: {useParams().classSlug}</p>
}

describe('renderWithProviders', () => {
  it('serves API calls from the fixtures', async () => {
    renderWithProviders(<ClassCount />)

    expect(await screen.findByText('6 classes')).toBeInTheDocument()
  })

  it('renders the element on the given route pattern', () => {
    renderWithProviders(<SlugEcho />, { path: '/classes/:classSlug', route: '/classes/mystic' })

    expect(screen.getByText('slug: mystic')).toBeInTheDocument()
  })

  it('applies response overrides without retrying', async () => {
    const { requests } = renderWithProviders(<ClassCount />, {
      overrides: [
        {
          method: 'GET',
          path: '/api/v1/classes',
          status: 503,
          body: { type: 'about:blank', title: 'Warehouse unavailable', status: 503 },
        },
      ],
    })

    expect(await screen.findByText('Warehouse unavailable')).toBeInTheDocument()
    expect(requests).toHaveLength(1)
  })

  it('exposes the router to assert navigation', () => {
    const { router } = renderWithProviders(<SlugEcho />, {
      path: '/classes/:classSlug',
      route: '/classes/mystic?spec=Awakening',
    })

    expect(router.state.location.search).toBe('?spec=Awakening')
  })

  it('renders a whole route tree at the given url', () => {
    renderRoutes([{ path: '/classes/:classSlug', element: <SlugEcho /> }], {
      route: '/classes/mystic',
    })

    expect(screen.getByText('slug: mystic')).toBeInTheDocument()
  })
})
