import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DqStatusBadge } from './DqStatusBadge'

describe('DqStatusBadge', () => {
  it.each([
    ['ok', 'OK'],
    ['warning', 'Warning'],
    ['no_damage', 'No damage'],
  ] as const)('labels the %s status as %s', (status, label) => {
    render(<DqStatusBadge status={status} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
