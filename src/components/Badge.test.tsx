import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('shows its text', () => {
    render(<Badge tone="warning">Warning</Badge>)

    expect(screen.getByText('Warning')).toBeInTheDocument()
  })
})
