import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import { ClassesPage } from './ClassesPage'

const classesUnavailable = {
  method: 'GET',
  path: '/api/v1/classes',
  status: 503,
  body: {
    type: 'about:blank',
    title: 'Warehouse unavailable',
    status: 503,
    detail: 'The DuckDB file is missing',
  },
}

describe('ClassesPage', () => {
  it('renders the fixture classes with their specs and skill count', async () => {
    renderWithProviders(<ClassesPage />)

    const items = await screen.findAllByRole('listitem')
    expect(items).toHaveLength(6)
    const mystic = screen.getByRole('link', { name: /Mystic/ }).closest('li') as HTMLElement
    expect(within(mystic).getByText('Succession, Awakening')).toBeInTheDocument()
    expect(within(mystic).getByText('95 skills')).toBeInTheDocument()
  })

  it('links each class to its skills page', async () => {
    renderWithProviders(<ClassesPage />)

    expect(await screen.findByRole('link', { name: /Mystic/ })).toHaveAttribute(
      'href',
      '/classes/mystic',
    )
  })

  it('shows a loading state first', () => {
    renderWithProviders(<ClassesPage />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading classes…')
  })

  it('shows the problem title and detail when the request fails', async () => {
    renderWithProviders(<ClassesPage />, { overrides: [classesUnavailable] })

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Warehouse unavailable')
    expect(alert).toHaveTextContent('The DuckDB file is missing')
  })

  it('says so when there is no class', async () => {
    renderWithProviders(<ClassesPage />, {
      overrides: [{ method: 'GET', path: '/api/v1/classes', status: 200, body: [] }],
    })

    expect(await screen.findByText('No class in this extract.')).toBeInTheDocument()
  })
})
