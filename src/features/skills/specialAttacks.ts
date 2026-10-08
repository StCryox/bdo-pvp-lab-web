import type { components } from '../../api/schema'

type Capabilities = Pick<
  components['schemas']['SkillSummary'],
  'can_down_attack' | 'can_air_attack'
>

export const specialAttacks = ({ can_down_attack, can_air_attack }: Capabilities): string =>
  [can_down_attack && 'Down', can_air_attack && 'Air'].filter(Boolean).join(', ') || '—'
