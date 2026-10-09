import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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

  // The skills table scrolls horizontally, which clips anything positioned inside it.
  const openAt = async (rect: Partial<DOMRect>) => {
    const user = userEvent.setup()
    renderTooltip()
    const trigger = screen.getByText('Term').closest('[tabindex]') as HTMLElement
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      ...rect,
    } as DOMRect)
    await user.hover(trigger)
    return screen.getByRole('tooltip')
  }

  it('is positioned on the viewport so a scrolling container cannot clip it', async () => {
    const tooltip = await openAt({ top: 40, bottom: 60, left: 500, right: 520 })

    expect(tooltip).toHaveStyle({ position: 'fixed' })
  })

  it('opens below a trigger in the upper half of the screen', async () => {
    const tooltip = await openAt({ top: 40, bottom: 60, left: 500, right: 520 })

    expect(tooltip).toHaveStyle({ top: '64px', right: `${window.innerWidth - 520}px` })
  })

  it('opens above a trigger in the lower half of the screen', async () => {
    const top = window.innerHeight - 40
    const tooltip = await openAt({ top, bottom: top + 20, left: 500, right: 520 })

    expect(tooltip).toHaveStyle({ bottom: '44px' })
  })

  it('stays inside the screen next to its left edge', async () => {
    const tooltip = await openAt({ top: 40, bottom: 60, left: 10, right: 30 })

    expect(tooltip).toHaveStyle({ left: '10px' })
  })
})
