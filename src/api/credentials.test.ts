import { describe, expect, it } from 'vitest'
import { isValidLogin } from './credentials'

describe('isValidLogin', () => {
  it('accepts the temporary login and password', () => {
    expect(isValidLogin('iamgroot', 'iamnotgrood')).toBe(true)
  })

  it('rejects a wrong password', () => {
    expect(isValidLogin('iamgroot', 'iamgroot')).toBe(false)
  })

  it('rejects a wrong login', () => {
    expect(isValidLogin('rocket', 'iamnotgrood')).toBe(false)
  })
})
