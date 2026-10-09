import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { FakeResponseOverride } from '../../test/fakeFetch'
import { renderWithProviders } from '../../test/renderWithProviders'
import { ClassSkillsPage } from './ClassSkillsPage'

const renderPage = (route = '/classes/mystic', overrides: FakeResponseOverride[] = []) =>
  renderWithProviders(<ClassSkillsPage />, { path: '/classes/:classSlug', route, overrides })

const estimateAllSkills = async (user: ReturnType<typeof renderPage>['user']) => {
  await user.click(await screen.findByText('Estimate against a target'))
  await user.click(screen.getByRole('button', { name: 'Estimate all skills' }))
}

const rowCells = (skillName: string) => {
  const row = screen.getByRole('link', { name: skillName }).closest('tr') as HTMLElement
  return within(row).getAllByRole('cell')
}

const estimateCell = (skillName: string) => rowCells(skillName)[10]

const expectedHeader = () => screen.getByRole('columnheader', { name: /^Expected HP loss/ })

const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)

const skillNames = () => bodyRows().map((row) => within(row).getAllByRole('cell')[0]?.textContent)

describe('ClassSkillsPage', () => {
  it('titles the page with the class name', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Mystic' })).toBeInTheDocument()
  })

  it('lists the skills of every spec in the order returned by the API', async () => {
    renderPage()

    await screen.findByRole('table')
    expect(skillNames()).toEqual([
      "Dragon's Maw · variant 1",
      "Dragon's Maw · variant 2",
      'Prime: Pulverize',
      'Wave Orb III',
      'Hurricane Kick',
      'Wave of Light',
      'Seethe',
    ])
  })

  it('shows one row per variant with its own damage multipliers', async () => {
    renderPage()

    await screen.findByRole('table')
    expect(rowCells("Dragon's Maw · variant 1").map((cell) => cell.textContent)).toContain('112.90')
    const second = rowCells("Dragon's Maw · variant 2")
    expect([second[2]?.textContent, second[3]?.textContent]).toEqual(['60.00', '200.00'])
  })

  it('shows the facts of each skill with fixed decimals', async () => {
    renderPage()

    const row = (await screen.findByRole('link', { name: 'Wave Orb III' })).closest(
      'tr',
    ) as HTMLElement
    const cells = within(row).getAllByRole('cell')
    expect(cells.slice(0, 7).map((cell) => cell.textContent)).toEqual([
      'Wave Orb III',
      '10.0 s',
      '78.76',
      '340.74',
      '100.00%',
      'Down',
      '—',
    ])
    expect(within(cells[7] as HTMLElement).getByText('OK')).toBeInTheDocument()
  })

  it('explains the DQ status of each skill', async () => {
    renderPage()

    const row = (await screen.findByRole('link', { name: 'Wave of Light' })).closest(
      'tr',
    ) as HTMLElement
    expect(within(row).getByText('Warning').closest('[tabindex]')).toHaveAccessibleDescription(
      /no PvP reduction/,
    )
  })

  it('shows a dash for a skill without damage and its DQ status', async () => {
    renderPage()

    const row = (await screen.findByRole('link', { name: 'Seethe' })).closest('tr') as HTMLElement
    const cells = within(row).getAllByRole('cell')
    expect(cells[2]).toHaveTextContent('—')
    expect(cells[3]).toHaveTextContent('—')
    expect(cells[4]).toHaveTextContent('—')
    expect(cells[7]).toHaveTextContent('No damage')
  })

  it('shows the crit rate of each skill as a percentage', async () => {
    renderPage()

    await screen.findByRole('table')
    expect(screen.getByRole('columnheader', { name: 'Crit rate' })).toBeInTheDocument()
    expect(bodyRows().map((row) => within(row).getAllByRole('cell')[4]?.textContent)).toEqual([
      '100.00%',
      '100.00%',
      '50.00%',
      '100.00%',
      '—',
      '100.00%',
      '—',
    ])
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
    expect(
      await screen.findByRole('link', { name: "Dragon's Maw · variant 1" }),
    ).toBeInTheDocument()
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

  it('filters the skills by name, ignoring case', async () => {
    const { user } = renderPage()

    await screen.findByRole('table')
    await user.type(screen.getByLabelText('Skill name'), 'wave')

    expect(skillNames()).toEqual(['Wave Orb III', 'Wave of Light'])
  })

  it('keeps every variant of a skill matching the name filter', async () => {
    const { user } = renderPage()

    await screen.findByRole('table')
    await user.type(screen.getByLabelText('Skill name'), "dragon's")

    expect(skillNames()).toEqual(["Dragon's Maw · variant 1", "Dragon's Maw · variant 2"])
  })

  it('says so when no skill matches the name filter', async () => {
    const { user } = renderPage()

    await screen.findByRole('table')
    await user.type(screen.getByLabelText('Skill name'), 'unknown')

    expect(screen.getByText('No skill matches “unknown”.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('keeps the name filter when switching spec tab', async () => {
    const { user } = renderPage()

    await screen.findByRole('table')
    await user.type(screen.getByLabelText('Skill name'), 'wave')
    await user.click(screen.getByRole('link', { name: 'Succession' }))

    expect(await screen.findByText('No skill matches “wave”.')).toBeInTheDocument()
    expect(screen.getByLabelText('Skill name')).toHaveValue('wave')
  })

  it('has no estimate column until the user estimates', async () => {
    renderPage()

    await screen.findByRole('table')
    expect(
      screen.queryByRole('columnheader', { name: /^Expected HP loss/ }),
    ).not.toBeInTheDocument()
  })

  it('shows the expected HP loss of each skill against the target', async () => {
    const { user } = renderPage()

    await estimateAllSkills(user)

    expect(
      await screen.findByRole('columnheader', { name: /^Expected HP loss/ }),
    ).toBeInTheDocument()
    await waitFor(() => expect(estimateCell('Wave Orb III')).toHaveTextContent('2706.32'))
  })

  it('shows the HP loss of one cast without and with crit', async () => {
    const { user } = renderPage()

    await estimateAllSkills(user)

    expect(await screen.findByRole('columnheader', { name: 'No crit' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Crit' })).toBeInTheDocument()
    await waitFor(() => expect(estimateCell('Wave Orb III')).toHaveTextContent('2706.32'))
    const cells = rowCells('Wave Orb III')
    expect([cells[8]?.textContent, cells[9]?.textContent]).toEqual(['1230.15', '2706.32'])
  })

  it('explains the expected HP loss in a tooltip', async () => {
    const { user } = renderPage()

    await estimateAllSkills(user)

    expect(await screen.findByLabelText('About expected HP loss')).toHaveAccessibleDescription(
      /average HP the target loses per cast/,
    )
  })

  it('estimates each damaging skill with the inputs of the form', async () => {
    const { requests, user } = renderPage()

    await user.click(await screen.findByText('Estimate against a target'))
    await user.clear(screen.getByLabelText('DR'))
    await user.type(screen.getByLabelText('DR'), '800')
    await user.click(screen.getByRole('button', { name: 'Estimate all skills' }))

    await waitFor(() => expect(estimateCell('Wave Orb III')).toHaveTextContent('2706.32'))
    const posts = requests.filter((r) => r.method === 'POST')
    const bodies = await Promise.all(posts.map((r) => r.json()))
    expect(bodies.map((b) => `${b.skill_id}/${b.variant}`).sort()).toEqual([
      '2731/1',
      '2754/1',
      '2786/1',
      '2794/1',
      '2801/1',
      '2801/2',
    ])
    expect(bodies.every((b) => b.class_slug === 'mystic' && b.defender.dr === 800)).toBe(true)
  })

  it('shows a dash for a skill without damage or whose estimate fails', async () => {
    const { user } = renderPage()

    await estimateAllSkills(user)

    await waitFor(() => expect(estimateCell('Wave Orb III')).toHaveTextContent('2706.32'))
    expect(estimateCell('Seethe')).toHaveTextContent('—')
    await waitFor(() => expect(estimateCell('Hurricane Kick')).toHaveTextContent('—'))
    expect(estimateCell('Hurricane Kick')).toHaveAttribute('title', 'Skill not found')
  })

  it('keeps the estimates when switching spec tab', async () => {
    const { user } = renderPage()

    await estimateAllSkills(user)
    await user.click(screen.getByRole('link', { name: 'Awakening' }))

    await screen.findByRole('link', { name: "Dragon's Maw · variant 1" })
    await waitFor(() => expect(estimateCell('Wave Orb III')).toHaveTextContent('2706.32'))
  })

  it('sorts the skills by expected HP loss, highest first, then lowest first', async () => {
    const { user } = renderPage()

    await estimateAllSkills(user)
    await waitFor(() => expect(estimateCell('Wave of Light')).toHaveTextContent('1256.50'))
    await user.click(screen.getByRole('button', { name: 'Expected HP loss' }))

    expect(expectedHeader()).toHaveAttribute('aria-sort', 'descending')
    expect(skillNames()).toEqual([
      'Wave Orb III',
      'Wave of Light',
      "Dragon's Maw · variant 1",
      "Dragon's Maw · variant 2",
      'Prime: Pulverize',
      'Hurricane Kick',
      'Seethe',
    ])

    await user.click(screen.getByRole('button', { name: 'Expected HP loss' }))

    expect(expectedHeader()).toHaveAttribute('aria-sort', 'ascending')
    expect(skillNames().slice(0, 2)).toEqual(['Wave of Light', 'Wave Orb III'])
  })

  it.each([
    [
      'PvP damage ×',
      [
        "Dragon's Maw · variant 1",
        'Prime: Pulverize',
        'Wave Orb III',
        "Dragon's Maw · variant 2",
        'Hurricane Kick',
        'Wave of Light',
        'Seethe',
      ],
      'Wave of Light',
    ],
    [
      'Total damage ×',
      [
        'Prime: Pulverize',
        'Wave Orb III',
        "Dragon's Maw · variant 1",
        'Wave of Light',
        "Dragon's Maw · variant 2",
        'Hurricane Kick',
        'Seethe',
      ],
      'Hurricane Kick',
    ],
    [
      'Crit rate',
      [
        "Dragon's Maw · variant 1",
        "Dragon's Maw · variant 2",
        'Wave Orb III',
        'Wave of Light',
        'Prime: Pulverize',
        'Hurricane Kick',
        'Seethe',
      ],
      'Prime: Pulverize',
    ],
  ])('sorts the skills by %s, highest first, then lowest first', async (column, order, lowest) => {
    const { user } = renderPage()

    await screen.findByRole('table')
    await user.click(screen.getByRole('button', { name: column }))

    expect(screen.getByRole('columnheader', { name: column })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    expect(skillNames()).toEqual(order)

    await user.click(screen.getByRole('button', { name: column }))

    expect(skillNames()[0]).toBe(lowest)
    expect(skillNames().at(-1)).toBe('Seethe')
  })

  it.each(['No crit', 'Crit'])('sorts the skills by HP loss %s, highest first', async (column) => {
    const { user } = renderPage()

    await estimateAllSkills(user)
    await waitFor(() => expect(estimateCell('Wave of Light')).toHaveTextContent('1256.50'))
    await user.click(screen.getByRole('button', { name: column }))

    expect(screen.getByRole('columnheader', { name: column })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    expect(skillNames().slice(0, 2)).toEqual(['Wave Orb III', 'Wave of Light'])
  })

  it('sorts by one column at a time', async () => {
    const { user } = renderPage()

    await screen.findByRole('table')
    await user.click(screen.getByRole('button', { name: 'Crit rate' }))
    await user.click(screen.getByRole('button', { name: 'PvP damage ×' }))

    expect(screen.getByRole('columnheader', { name: 'Crit rate' })).not.toHaveAttribute('aria-sort')
    expect(screen.getByRole('columnheader', { name: 'PvP damage ×' })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
  })

  it('keeps the API order until the user sorts by expected HP loss', async () => {
    const { user } = renderPage()

    await estimateAllSkills(user)
    await waitFor(() => expect(estimateCell('Wave Orb III')).toHaveTextContent('2706.32'))

    expect(expectedHeader()).not.toHaveAttribute('aria-sort')
    expect(skillNames()[0]).toBe("Dragon's Maw · variant 1")
  })
})
