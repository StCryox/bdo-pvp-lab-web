import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/client'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('shows the problem title and detail of an API error', () => {
    const error = new ApiError({
      type: 'https://bdo-pvp-lab.local/problems/skill-not-found',
      title: 'Skill not found',
      status: 404,
      detail: 'No skill 9999 for class mystic',
    })

    render(<ErrorState error={error} />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Skill not found')
    expect(alert).toHaveTextContent('No skill 9999 for class mystic')
  })

  it('shows the message of any other error', () => {
    render(<ErrorState error={new Error('Failed to fetch')} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch')
  })
})
