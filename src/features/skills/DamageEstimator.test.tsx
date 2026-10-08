import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { FakeResponseOverride } from '../../test/fakeFetch'
import { renderWithProviders } from '../../test/renderWithProviders'
import { DamageEstimator } from './DamageEstimator'

const renderEstimator = (skillId = 2786, overrides: FakeResponseOverride[] = []) =>
  renderWithProviders(<DamageEstimator classSlug="mystic" skillId={skillId} />, { overrides })

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

    const table = await screen.findByRole('table', { name: 'Expected HP loss per clause' })
    const rows = within(table)
      .getAllByRole('row')
      .slice(1)
      .map((row) =>
        within(row)
          .getAllByRole('cell')
          .map((cell) => cell.textContent),
      )
    expect(rows).toEqual([
      ['1', 'Base damage', 'Yes', '1424.25'],
      ['2', 'Extra damage', 'Yes', '1282.07'],
    ])
  })

  it('lists the warnings of the estimate', async () => {
    const warning = 'Back attack capability is not verified in the data (BR-SPEC-01)'
    const { user } = renderEstimator(2786, [
      {
        method: 'POST',
        path: '/api/v1/damage/estimate',
        status: 200,
        body: {
          class_slug: 'mystic',
          skill_id: 2786,
          skill_name: 'Wave Orb III',
          hit_rate: 1,
          base_damage: 345,
          damage_reduction_rate: 0.3,
          special_attack: 'back',
          special_multiplier: 1.2,
          expected_crit_multiplier: 2.2,
          pvp_modifier: 1,
          clauses: [],
          total_expected_hp_loss: 0,
          warnings: [warning],
        },
      },
    ])

    await user.click(estimate())

    expect(await screen.findByRole('list', { name: 'Warnings' })).toHaveTextContent(warning)
  })

  it('shows the 422 problem detail inline', async () => {
    const { user } = renderEstimator(2722)

    await user.click(estimate())

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Skill cannot be estimated')
    expect(alert).toHaveTextContent('Skill 2722 of class mystic has no damage clause')
  })
})
