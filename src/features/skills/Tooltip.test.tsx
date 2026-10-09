import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Tooltip } from './Tooltip'

const renderTooltip = () =>
  render(
    <Tooltip text="What this means">
      <span>Term</span>
    </Tooltip>,
  )

describe('Tooltip', () => {
  it('describes its trigger with the text for assistive technologies', () => {
    renderTooltip()

    expect(screen.getByText('Term').closest('[tabindex]')).toHaveAccessibleDescription(
      'What this means',
    )
  })

  it('names its trigger when given a label', () => {
    render(
      <Tooltip text="What this means" label="About the term">
        <span aria-hidden="true">ⓘ</span>
      </Tooltip>,
    )

    expect(screen.getByLabelText('About the term')).toHaveAccessibleDescription('What this means')
  })

  it('shows the text on hover only', async () => {
    const user = userEvent.setup()
    renderTooltip()
    const tooltip = screen.getByRole('tooltip', { hidden: true })

    expect(tooltip).not.toBeVisible()
    await user.hover(screen.getByText('Term'))
    expect(tooltip).toBeVisible()
    await user.unhover(screen.getByText('Term'))
    expect(tooltip).not.toBeVisible()
  })

  it('shows the text on keyboard focus and hides it on Escape', async () => {
    const user = userEvent.setup()
    renderTooltip()

    await user.tab()
    expect(screen.getByRole('tooltip')).toBeVisible()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('tooltip', { hidden: true })).not.toBeVisible()
  })
})
