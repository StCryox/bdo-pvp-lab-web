import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Loading } from './Loading'

describe('Loading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('announces what is loading', () => {
    render(<Loading what="skills" />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading skills…')
  })

  it('says the server may be waking up when loading takes more than 3 s', () => {
    render(<Loading what="skills" />)

    act(() => vi.advanceTimersByTime(2999))
    expect(screen.getByRole('status')).not.toHaveTextContent(/waking up/i)

    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading skills… Waking up the server, this can take up to a minute.',
    )
  })
})
