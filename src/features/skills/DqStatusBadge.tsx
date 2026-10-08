import { Badge, type BadgeTone } from '../../components/Badge'
import type { components } from '../../api/schema'

type DqStatus = components['schemas']['DqStatus']

const display: Record<DqStatus, { tone: BadgeTone; label: string }> = {
  ok: { tone: 'ok', label: 'OK' },
  warning: { tone: 'warning', label: 'Warning' },
  no_damage: { tone: 'neutral', label: 'No damage' },
}

export function DqStatusBadge({ status }: { status: DqStatus }) {
  const { tone, label } = display[status]
  return <Badge tone={tone}>{label}</Badge>
}
