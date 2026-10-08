import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { components } from '../../api/schema'
import type { FakeResponseOverride } from '../../test/fakeFetch'
import { renderWithProviders } from '../../test/renderWithProviders'
import { DamageEstimator } from './DamageEstimator'

type DamageClause = components['schemas']['DamageClause']

const clause = (
  source_order: number,
  clause_index: number,
  clause_label: string,
  is_selector_alias = false,
): DamageClause => ({
  source_order,
  clause_index,
  clause_label,
  macro: 'DAM_ATT_2',
  damage_multiplier: 59.76,
  hits: 2,
  is_selector_alias,
  pvp_kept_ratio: 0.25,
  pvp_damage_multiplier: 29.88,
  crit_rate: 1,
  dq_flag: null,
})

const renderEstimator = (
  skillId = 2786,
  overrides: FakeResponseOverride[] = [],
  clauses: DamageClause[] = [clause(1, 1, 'Base damage'), clause(2, 2, 'Extra damage')],
) =>
  renderWithProviders(<DamageEstimator classSlug="mystic" skillId={skillId} clauses={clauses} />, {
    overrides,
  })

const estimateResponse = (
  clauses: components['schemas']['ClauseEstimate'][],
  warnings: string[] = [],
) => ({
  method: 'POST',
  path: '/api/v1/damage/estimate',
  status: 200,
  body: {
    class_slug: 'mystic',
    skill_id: 2794,
    skill_name: 'Wave of Light',
    hit_rate: 1,
    base_damage: 345,
    damage_reduction_rate: 0.3,
    special_attack: 'back',
    special_multiplier: 1.2,
    expected_crit_multiplier: 2.2,
    pvp_modifier: 1,
    clauses,
    total_expected_hp_loss: 877.8,
    warnings,
  },
})

const clauseEstimateRows = () =>
  within(screen.getByRole('table', { name: 'Expected HP loss per clause' }))
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    )

const estimate = () => screen.getByRole('button', { name: 'Estimate damage' })

const fact = (term: string) => screen.getByText(term, { selector: 'dt' }).nextElementSibling

describe('DamageEstimator', () => {
  it('fills the form with the default attacker, defender and situation', () => {
    renderEstimator()

    expect(screen.getByLabelText('AP')).toHaveValue(1085)
    expect(screen.getByLabelText('Accuracy')).toHaveValue(1353)
    expect(screen.getByLabelText('DR')).toHaveValue(740)
    expect(screen.getByLabelText('Evasion')).toHaveValue(1197)
    expect(screen.getByLabelText('Target state')).toHaveValue('downed')
    expect(screen.getByLabelText('From behind')).not.toBeChecked()
    expect(screen.getByLabelText('PvP modifier')).toHaveValue(1)
  })

  it('submits the default form as the contract example', async () => {
    const { requests, user } = renderEstimator()

    await user.click(estimate())

    await screen.findByText('2706.32')
    const post = requests.find((r) => r.method === 'POST')
    expect(await post?.json()).toEqual({
      class_slug: 'mystic',
      skill_id: 2786,
      attacker: {
        ap: 1085,
        accuracy: 1353,
        crit_damage_bonus: 0.2,
        back_attack_bonus: 0,
        down_attack_bonus: 0,
        air_attack_bonus: 0,
      },
      defender: { dr: 740, evasion: 1197, super_armor_dr_rate: 0.1 },
      situation: {
        target_state: 'downed',
        from_behind: false,
        target_in_super_armor: false,
        pvp_modifier: 1,
      },
    })
  })

  it('sends the values the user entered', async () => {
    const { requests, user } = renderEstimator()

    await user.clear(screen.getByLabelText('AP'))
    await user.type(screen.getByLabelText('AP'), '1200')
    await user.selectOptions(screen.getByLabelText('Target state'), 'standing')
    await user.click(screen.getByLabelText('From behind'))
    await user.click(screen.getByLabelText('Target in super armor'))
    await user.click(estimate())

    await screen.findByText('2706.32')
    const body = await requests.find((r) => r.method === 'POST')?.json()
    expect(body.attacker.ap).toBe(1200)
    expect(body.situation).toMatchObject({
      target_state: 'standing',
      from_behind: true,
      target_in_super_armor: true,
    })
  })

  it('shows the total expected HP loss and its breakdown', async () => {
    const { user } = renderEstimator()

    await user.click(estimate())

    expect(await screen.findByText('2706.32')).toBeInTheDocument()
    expect(fact('Hit rate')).toHaveTextContent('100.00%')
    expect(fact('Base damage')).toHaveTextContent('345.00')
    expect(fact('DR rate')).toHaveTextContent('30.00%')
    expect(fact('Special attack')).toHaveTextContent('down × 1.20')
    expect(fact('Expected crit ×')).toHaveTextContent('2.20')
    expect(fact('PvP modifier')).toHaveTextContent('1.00')
  })

  it('shows the expected HP loss of each clause', async () => {
    const { user } = renderEstimator()

    await user.click(estimate())

    await screen.findByRole('table', { name: 'Expected HP loss per clause' })
    expect(clauseEstimateRows()).toEqual([
      ['1', 'Base damage', 'Yes', '1424.25'],
      ['2', 'Extra damage', 'Yes', '1282.07'],
    ])
  })

  it('lists the warnings of the estimate', async () => {
    const warning = 'Back attack capability is not verified in the data (BR-SPEC-01)'
    const { user } = renderEstimator(2794, [estimateResponse([], [warning])])

    await user.click(estimate())

    expect(await screen.findByRole('list', { name: 'Warnings' })).toHaveTextContent(warning)
  })

  it('says which excluded clauses are selector aliases', async () => {
    const { user } = renderEstimator(
      2794,
      [
        estimateResponse([
          {
            source_order: 1,
            clause_index: 1,
            clause_label: 'Base damage',
            included: true,
            expected_hp_loss: 877.8,
          },
          {
            source_order: 2,
            clause_index: 2,
            clause_label: 'Extra damage',
            included: false,
            expected_hp_loss: 0,
          },
          {
            source_order: 3,
            clause_index: 1,
            clause_label: 'Base damage',
            included: false,
            expected_hp_loss: 0,
          },
        ]),
      ],
      [
        clause(1, 1, 'Base damage'),
        clause(2, 2, 'Extra damage'),
        clause(3, 1, 'Base damage', true),
      ],
    )

    await user.click(estimate())

    await screen.findByRole('table', { name: 'Expected HP loss per clause' })
    expect(clauseEstimateRows()).toEqual([
      ['1', 'Base damage', 'Yes', '877.80'],
      ['2', 'Extra damage', 'No', '0.00'],
      ['1', 'Base damage', 'No (selector alias)', '0.00'],
    ])
  })

  it('shows the 422 problem detail inline', async () => {
    const { user } = renderEstimator(2722)

    await user.click(estimate())

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Skill cannot be estimated')
    expect(alert).toHaveTextContent('Skill 2722 of class mystic has no damage clause')
  })
})
