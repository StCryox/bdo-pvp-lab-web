import type { ReactNode } from 'react'

export type BadgeTone = 'ok' | 'warning' | 'danger' | 'neutral'

const toneClass: Record<BadgeTone, string> = {
  ok: 'border-emerald-700 bg-emerald-950 text-emerald-300',
  warning: 'border-amber-700 bg-amber-950 text-amber-300',
  danger: 'border-red-700 bg-red-950 text-red-300',
  neutral: 'border-zinc-700 bg-zinc-900 text-zinc-300',
}

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium ${toneClass[tone]}`}
    >
      {children}
    </span>
  )
}
