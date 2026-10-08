import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { FakeResponseOverride } from '../../test/fakeFetch'
import { renderWithProviders } from '../../test/renderWithProviders'
import { ClassSkillsPage } from './ClassSkillsPage'

const renderPage = (route = '/classes/mystic', overrides: FakeResponseOverride[] = []) =>
  renderWithProviders(<ClassSkillsPage />, { path: '/classes/:classSlug', route, overrides })

const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)

describe('ClassSkillsPage', () => {
  it('titles the page with the class name', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Mystic' })).toBeInTheDocument()
  })

  it('lists the skills of every spec in the order returned by the API', async () => {
    renderPage()

    await screen.findByRole('table')
    expect(bodyRows().map((row) => within(row).getAllByRole('cell')[0]?.textContent)).toEqual([
      "Dragon's Maw",
      'Prime: Pulverize',
      'Wave Orb III',
      'Hurricane Kick',
      'Wave of Light',
      'Seethe',
    ])
  })

  it('shows the facts of each skill with fixed decimals', async () => {
    renderPage()

    const row = (await screen.findByRole('link', { name: 'Wave Orb III' })).closest(
      'tr',
    ) as HTMLElement
    expect(
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['Wave Orb III', '10.0 s', '78.76', '340.74', 'Down', '—', 'OK'])
  })

  it('shows a dash for a skill without damage and its DQ status', async () => {
    renderPage()

    const row = (await screen.findByRole('link', { name: 'Seethe' })).closest('tr') as HTMLElement
    const cells = within(row).getAllByRole('cell')
    expect(cells[2]).toHaveTextContent('—')
    expect(cells[3]).toHaveTextContent('—')
    expect(cells[6]).toHaveTextContent('No damage')
  })

  it('links each skill to its detail page', async () => {
    renderPage()

    expect(await screen.findByRole('link', { name: 'Wave Orb III' })).toHaveAttribute(
      'href',
      '/classes/mystic/skills/2786',
    )
  })

  it('offers one tab per spec of the class plus all specs', async () => {
    renderPage()

    const tabs = await screen.findByRole('navigation', { name: 'Specs' })
    expect(
      within(tabs)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['All specs', 'Succession', 'Awakening'])
    expect(within(tabs).getByRole('link', { name: 'All specs' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('switches spec tab and updates the URL', async () => {
    const { router, user } = renderPage()

    await user.click(await screen.findByRole('link', { name: 'Awakening' }))

    expect(router.state.location.search).toBe('?spec=Awakening')
    expect(screen.getByRole('link', { name: 'Awakening' })).toHaveAttribute('aria-current', 'page')
    expect(await screen.findByRole('link', { name: "Dragon's Maw" })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Prime: Pulverize' })).not.toBeInTheDocument()
  })

  it('goes back to all specs from a spec tab', async () => {
    const { router, user } = renderPage('/classes/mystic?spec=Awakening')

    await user.click(await screen.findByRole('link', { name: 'All specs' }))

    expect(router.state.location.search).toBe('')
    expect(await screen.findByRole('link', { name: 'Prime: Pulverize' })).toBeInTheDocument()
  })

  it('requests the spec from the URL', async () => {
    const { requests } = renderPage('/classes/mystic?spec=Succession')

    await screen.findByRole('table')
    const skillRequest = requests.find((r) => r.url.includes('/skills'))
    expect(new URL(skillRequest?.url ?? '').searchParams.get('spec')).toBe('Succession')
  })

  it('shows a loading state first', () => {
    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading skills…')
  })

  it('shows the problem of an unknown class', async () => {
    renderPage('/classes/unknown')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Class not found')
    expect(alert).toHaveTextContent('No class unknown')
  })

  it('says so when the spec has no skill', async () => {
    renderPage('/classes/mystic', [
      { method: 'GET', path: '/api/v1/classes/mystic/skills', status: 200, body: [] },
    ])

    expect(await screen.findByText('No skill for this spec.')).toBeInTheDocument()
  })
})
