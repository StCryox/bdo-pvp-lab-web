const MISSING = '—'

export const formatNumber = (value: number | null | undefined, decimals = 2): string =>
  value == null ? MISSING : value.toFixed(decimals)

export const formatPercent = (ratio: number | null | undefined): string =>
  ratio == null ? MISSING : `${(ratio * 100).toFixed(2)}%`

export const formatSeconds = (ms: number | null | undefined): string =>
  ms == null ? MISSING : `${(ms / 1000).toFixed(1)} s`
