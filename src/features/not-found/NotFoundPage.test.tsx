import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import { NotFoundPage } from './NotFoundPage'

describe('NotFoundPage', () => {
  it('says the page does not exist and links back to the classes', () => {
    renderWithProviders(<NotFoundPage />)

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to classes' })).toHaveAttribute('href', '/')
  })
})
