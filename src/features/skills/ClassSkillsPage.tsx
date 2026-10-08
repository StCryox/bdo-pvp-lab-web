import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router'
import { useApiClient } from '../../api/apiContext'
import { classSkillsQuery, classesQuery } from '../../api/queries'
import type { components } from '../../api/schema'
import { ErrorState } from '../../components/ErrorState'
import { Loading } from '../../components/Loading'
import { formatNumber, formatSeconds } from '../../format'
import { DqStatusBadge } from './DqStatusBadge'

type SkillSummary = components['schemas']['SkillSummary']

const specSearch = (spec: string | undefined) =>
  spec === undefined ? '' : `?${new URLSearchParams({ spec })}`

function SpecTabs({ specs, current }: { specs: string[]; current: string | undefined }) {
  const tabs = [
    { label: 'All specs', spec: undefined },
    ...specs.map((spec) => ({ label: spec, spec })),
  ]
  return (
    <nav aria-label="Specs" className="flex flex-wrap gap-1 border-b border-zinc-800">
      {tabs.map(({ label, spec }) => {
        const active = spec === current
        return (
          <Link
            key={label}
            to={{ search: specSearch(spec) }}
            aria-current={active ? 'page' : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${active ? 'border-sky-400 text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

const specialAttacks = (skill: SkillSummary) =>
  [skill.can_down_attack && 'Down', skill.can_air_attack && 'Air'].filter(Boolean).join(', ') || '—'

function SkillsTable({ classSlug, spec }: { classSlug: string; spec: string | undefined }) {
  const { data, error, isPending } = useQuery(classSkillsQuery(useApiClient(), classSlug, spec))

  if (isPending) return <Loading what="skills" />
  if (error) return <ErrorState error={error} />
  if (data.length === 0) return <p className="text-zinc-400">No skill for this spec.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-zinc-400">
          <tr className="border-b border-zinc-800">
            <th scope="col" className="py-2 pr-4 font-medium">
              Skill
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              Cooldown
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              PvP damage ×
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              Total damage ×
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Down / air
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              PvP CC
            </th>
            <th scope="col" className="py-2 font-medium">
              DQ
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((skill) => (
            <tr key={skill.skill_id} className="border-b border-zinc-900 hover:bg-zinc-900">
              <td className="py-2 pr-4">
                <Link
                  to={`/classes/${classSlug}/skills/${skill.skill_id}`}
                  className="text-sky-400 hover:text-sky-300"
                >
                  {skill.skill_name}
                </Link>
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatSeconds(skill.cooldown_ms)}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatNumber(skill.pvp_damage_multiplier)}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatNumber(skill.total_damage_multiplier)}
              </td>
              <td className="py-2 pr-4">{specialAttacks(skill)}</td>
              <td className="py-2 pr-4">{skill.pvp_cc.join(', ') || '—'}</td>
              <td className="py-2">
                <DqStatusBadge status={skill.dq_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ClassSkillsPage() {
  const classSlug = useParams().classSlug ?? ''
  const spec = useSearchParams()[0].get('spec') ?? undefined
  const { data: classes } = useQuery(classesQuery(useApiClient()))
  const playerClass = classes?.find((c) => c.class_slug === classSlug)

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{playerClass?.class_name ?? classSlug}</h1>
      {playerClass && <SpecTabs specs={playerClass.specs} current={spec} />}
      <SkillsTable classSlug={classSlug} spec={spec} />
    </section>
  )
}
