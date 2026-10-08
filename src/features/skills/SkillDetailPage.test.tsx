import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { FakeResponseOverride } from '../../test/fakeFetch'
import { renderWithProviders } from '../../test/renderWithProviders'
import { SkillDetailPage } from './SkillDetailPage'

const renderPage = (
  route = '/classes/mystic/skills/2786',
  overrides: FakeResponseOverride[] = [],
) =>
  renderWithProviders(<SkillDetailPage />, {
    path: '/classes/:classSlug/skills/:skillId',
    route,
    overrides,
  })

const fact = (term: string) => screen.getByText(term, { selector: 'dt' }).nextElementSibling

const clauseRows = () =>
  within(screen.getByRole('table', { name: 'Damage clauses' }))
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    )

describe('SkillDetailPage', () => {
  it('titles the page with the skill name and links back to the class', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Wave Orb III' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to mystic skills' })).toHaveAttribute(
      'href',
      '/classes/mystic',
    )
  })

  it('shows the facts of the skill', async () => {
    renderPage()

    await screen.findByRole('heading', { name: 'Wave Orb III' })
    expect(fact('Specs')).toHaveTextContent('Awakening')
    expect(fact('Cooldown')).toHaveTextContent('10.0 s')
    expect(fact('Crit rate')).toHaveTextContent('100.00%')
    expect(fact('Down / air')).toHaveTextContent('Down')
    expect(fact('Max targets')).toHaveTextContent('10')
    expect(fact('PvP CC')).toHaveTextContent('—')
    expect(fact('PvP damage ×')).toHaveTextContent('78.76')
    expect(fact('Total damage ×')).toHaveTextContent('340.74')
    expect(fact('DQ status')).toHaveTextContent('OK')
  })

  it('shows the clauses of 2786 with their PvP kept share', async () => {
    renderPage()

    await screen.findByRole('table', { name: 'Damage clauses' })
    expect(clauseRows()).toEqual([
      ['1', 'Base damage', 'DAM_ATT_2', '96.98', '2', '21.37%', '41.45', '100.00%', '—'],
      ['2', 'Extra damage', 'DAM_ATT_2', '73.39', '2', '25.42%', '37.31', '100.00%', '—'],
    ])
  })

  it('notes the CC that only apply in PvE', async () => {
    renderPage()

    expect(await screen.findByText(/only apply in PvE/)).toHaveTextContent(
      'These CC only apply in PvE: bound',
    )
  })

  it('flags a clause without PvP reduction', async () => {
    renderPage('/classes/mystic/skills/2794')

    await screen.findByRole('table', { name: 'Damage clauses' })
    expect(clauseRows()[1]).toEqual([
      '2',
      'Extra damage',
      'DAM_ATT_1',
      '83.49',
      '2',
      '—',
      '—',
      '100.00%',
      'no_pvp_reduction',
    ])
    expect(screen.queryByText(/only apply in PvE/)).not.toBeInTheDocument()
  })

  it('says so when the skill has no damage clause', async () => {
    const seethe = {
      class_slug: 'mystic',
      skill_id: 2722,
      skill_name: 'Seethe',
      specs: ['Succession', 'Awakening'],
      cooldown_ms: 30000,
      crit_rate: null,
      can_down_attack: false,
      can_air_attack: false,
      max_targets: null,
      pvp_cc: [],
      clause_count: 0,
      total_damage_multiplier: null,
      pvp_damage_multiplier: null,
      dq_status: 'no_damage',
      pve_only_cc: [],
      clauses: [],
    }
    renderPage('/classes/mystic/skills/2722', [
      { method: 'GET', path: '/api/v1/classes/mystic/skills/2722', status: 200, body: seethe },
    ])

    expect(await screen.findByText('This skill has no damage clause.')).toBeInTheDocument()
    expect(fact('DQ status')).toHaveTextContent('No damage')
  })

  it('shows a loading state first', () => {
    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading skill…')
  })

  it('shows the problem title of an unknown skill', async () => {
    renderPage('/classes/mystic/skills/9999')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Skill not found')
    expect(alert).toHaveTextContent('No skill 9999 for class mystic')
  })

  it('shows the not found page for a skill id that is not a number', () => {
    renderPage('/classes/mystic/skills/orb')

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
