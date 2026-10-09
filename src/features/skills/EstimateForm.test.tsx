import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EstimateForm, type EstimateInputs } from './EstimateForm'

const renderForm = (pending = false) => {
  const onSubmit = vi.fn<(inputs: EstimateInputs) => void>()
  render(<EstimateForm onSubmit={onSubmit} pending={pending} submitLabel="Estimate" />)
  return { onSubmit, user: userEvent.setup() }
}

describe('EstimateForm', () => {
  it('submits the default attacker, defender and situation of the contract example', async () => {
    const { onSubmit, user } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Estimate' }))

    expect(onSubmit).toHaveBeenCalledWith({
      attacker: {
        ap: 1085,
        accuracy: 1353,
        crit_rate_bonus: 0,
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

  it('submits the values the user entered', async () => {
    const { onSubmit, user } = renderForm()

    await user.clear(screen.getByLabelText('DR'))
    await user.type(screen.getByLabelText('DR'), '800')
    await user.selectOptions(screen.getByLabelText('Target state'), 'airborne')
    await user.click(screen.getByLabelText('From behind'))
    await user.click(screen.getByRole('button', { name: 'Estimate' }))

    const inputs = onSubmit.mock.calls[0]?.[0]
    expect(inputs?.defender.dr).toBe(800)
    expect(inputs?.situation).toMatchObject({ target_state: 'airborne', from_behind: true })
  })

  it('shows the rates and bonuses as percentages', () => {
    renderForm()

    expect(screen.getByLabelText('Crit rate bonus (%)')).toHaveValue(0)
    expect(screen.getByLabelText('Crit damage bonus (%)')).toHaveValue(20)
    expect(screen.getByLabelText('Super armor DR rate (%)')).toHaveValue(10)
  })

  it('sends the percentages the user typed as fractions', async () => {
    const { onSubmit, user } = renderForm()

    const typePercent = async (label: string, value: string) => {
      await user.clear(screen.getByLabelText(label))
      await user.type(screen.getByLabelText(label), value)
    }
    await typePercent('Crit rate bonus (%)', '90')
    await typePercent('Crit damage bonus (%)', '35')
    await typePercent('Back attack bonus (%)', '12.5')
    await typePercent('Down attack bonus (%)', '7')
    await typePercent('Air attack bonus (%)', '3')
    await typePercent('Super armor DR rate (%)', '25')
    await user.click(screen.getByRole('button', { name: 'Estimate' }))

    const inputs = onSubmit.mock.calls[0]?.[0]
    expect(inputs?.attacker).toMatchObject({
      crit_rate_bonus: 0.9,
      crit_damage_bonus: 0.35,
      back_attack_bonus: 0.125,
      down_attack_bonus: 0.07,
      air_attack_bonus: 0.03,
    })
    expect(inputs?.defender.super_armor_dr_rate).toBe(0.25)
  })

  it('does not accept a crit rate bonus above 100%', () => {
    renderForm()

    expect(screen.getByLabelText('Crit rate bonus (%)')).toHaveAttribute('max', '100')
  })

  it('disables the submit button while an estimate is pending', () => {
    renderForm(true)

    expect(screen.getByRole('button', { name: 'Estimate' })).toBeDisabled()
  })
})
