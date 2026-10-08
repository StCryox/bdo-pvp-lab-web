import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Loading } from './Loading'

describe('Loading', () => {
  it('announces what is loading', () => {
    render(<Loading what="skills" />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading skills…')
  })
})
