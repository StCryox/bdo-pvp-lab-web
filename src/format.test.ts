import { describe, expect, it } from 'vitest'
import { formatNumber, formatPercent, formatSeconds } from './format'

describe('formatNumber', () => {
  it('shows two decimals by default', () => {
    expect(formatNumber(96.98)).toBe('96.98')
    expect(formatNumber(2)).toBe('2.00')
  })

  it('accepts another number of decimals', () => {
    expect(formatNumber(1085, 0)).toBe('1085')
  })

  it('shows a dash for a missing value', () => {
    expect(formatNumber(null)).toBe('—')
    expect(formatNumber(undefined)).toBe('—')
  })
})

describe('formatPercent', () => {
  it('shows a ratio as a percentage with two decimals', () => {
    expect(formatPercent(0.2137)).toBe('21.37%')
    expect(formatPercent(1)).toBe('100.00%')
  })

  it('shows a dash for a missing ratio', () => {
    expect(formatPercent(null)).toBe('—')
  })
})

describe('formatSeconds', () => {
  it('shows milliseconds as seconds with one decimal', () => {
    expect(formatSeconds(10000)).toBe('10.0 s')
    expect(formatSeconds(1500)).toBe('1.5 s')
  })

  it('shows a dash for a missing duration', () => {
    expect(formatSeconds(null)).toBe('—')
  })
})
