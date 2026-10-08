import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Fact } from './Fact'

describe('Fact', () => {
  it('pairs a term with its value in a description list', () => {
    render(
      <dl>
        <Fact term="Cooldown">10.0 s</Fact>
      </dl>,
    )

    expect(screen.getByRole('term')).toHaveTextContent('Cooldown')
    expect(screen.getByRole('definition')).toHaveTextContent('10.0 s')
  })
})
