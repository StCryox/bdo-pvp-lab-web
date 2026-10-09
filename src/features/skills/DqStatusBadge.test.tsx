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

  it.each([
    ['ok', 'Every damage clause has a PvP reduction.'],
    [
      'warning',
      'At least one damage clause has a PvP data issue: no PvP reduction (BR-PVP-03/04), left out of the PvP damage and of the estimate, or a reduction that cannot be paired with certainty (BR-PVP-05), estimated with the first one.',
    ],
    ['no_damage', 'This skill has no damage clause: it cannot be estimated.'],
  ] as const)('explains the %s status', (status, meaning) => {
    render(<DqStatusBadge status={status} />)

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(meaning)
  })

  it('shows its meaning in a tooltip on the badge', () => {
    render(<DqStatusBadge status="warning" />)

    expect(screen.getByText('Warning').closest('[tabindex]')).toHaveAccessibleDescription(
      /no PvP reduction/,
    )
  })
})
