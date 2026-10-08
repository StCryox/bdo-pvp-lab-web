import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { routes } from './router'
import { renderRoutes } from './test/renderWithProviders'

describe('routes', () => {
  it('shows the not found page inside the layout for an unknown url', async () => {
    renderRoutes(routes, { route: '/nowhere' })

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(await screen.findByText('2026-09-30')).toBeInTheDocument()
  })
})
