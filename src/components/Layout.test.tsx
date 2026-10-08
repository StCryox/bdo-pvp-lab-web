import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/renderWithProviders'
import { Layout } from './Layout'

describe('Layout', () => {
  it('shows the extract id and the game builds from the meta endpoint', async () => {
    renderWithProviders(<Layout />)

    expect(await screen.findByText('2026-09-30')).toBeInTheDocument()
    expect(
      screen.getByText('20260806_094229_44630388, 20260809_234536_44631144'),
    ).toBeInTheDocument()
  })

  it('links to the classes and data quality pages', () => {
    renderWithProviders(<Layout />)

    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toContainElement(screen.getByRole('link', { name: 'Classes' }))
    expect(screen.getByRole('link', { name: 'Classes' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Data quality' })).toHaveAttribute(
      'href',
      '/data-quality',
    )
  })

  it('marks the link of the current page', () => {
    renderWithProviders(<Layout />, { path: '/data-quality', route: '/data-quality' })

    expect(screen.getByRole('link', { name: 'Data quality' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Classes' })).not.toHaveAttribute('aria-current')
  })

  it('says the extract info is unavailable when the meta request fails', async () => {
    renderWithProviders(<Layout />, {
      overrides: [
        {
          method: 'GET',
          path: '/api/v1/meta',
          status: 503,
          body: { type: 'about:blank', title: 'Warehouse unavailable', status: 503 },
        },
      ],
    })

    expect(
      await screen.findByText('Extract info unavailable: Warehouse unavailable'),
    ).toBeInTheDocument()
  })
})
