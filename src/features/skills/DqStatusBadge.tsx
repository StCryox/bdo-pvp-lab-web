import { Badge, type BadgeTone } from '../../components/Badge'
import type { components } from '../../api/schema'
import { Tooltip } from './Tooltip'

type DqStatus = components['schemas']['DqStatus']

const display: Record<DqStatus, { tone: BadgeTone; label: string; meaning: string }> = {
  ok: { tone: 'ok', label: 'OK', meaning: 'Every damage clause has a PvP reduction.' },
  warning: {
    tone: 'warning',
    label: 'Warning',
    meaning:
      'At least one damage clause has a PvP data issue: no PvP reduction (BR-PVP-03/04), left out of the PvP damage and of the estimate, or a reduction that cannot be paired with certainty (BR-PVP-05), estimated with the first one.',
  },
  no_damage: {
    tone: 'neutral',
    label: 'No damage',
    meaning: 'This skill has no damage clause: it cannot be estimated.',
  },
}

export function DqStatusBadge({ status }: { status: DqStatus }) {
  const { tone, label, meaning } = display[status]
  return (
    <Tooltip text={meaning}>
      <Badge tone={tone}>{label}</Badge>
    </Tooltip>
  )
}
