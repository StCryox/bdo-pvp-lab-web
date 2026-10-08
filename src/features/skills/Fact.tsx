import type { ReactNode } from 'react'

export function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{term}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  )
}
