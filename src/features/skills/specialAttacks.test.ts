import { describe, expect, it } from 'vitest'
import { specialAttacks } from './specialAttacks'

describe('specialAttacks', () => {
  it('lists the down and air capabilities of a skill', () => {
    expect(specialAttacks({ can_down_attack: true, can_air_attack: true })).toBe('Down, Air')
    expect(specialAttacks({ can_down_attack: false, can_air_attack: true })).toBe('Air')
  })

  it('shows a dash when the skill has neither', () => {
    expect(specialAttacks({ can_down_attack: false, can_air_attack: false })).toBe('—')
  })
})
