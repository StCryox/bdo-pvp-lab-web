import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { useApiClient } from '../../api/apiContext'
import { skillQuery } from '../../api/queries'
import type { components } from '../../api/schema'
import { ErrorState } from '../../components/ErrorState'
import { Loading } from '../../components/Loading'
import { formatNumber, formatPercent, formatSeconds } from '../../format'
import { NotFoundPage } from '../not-found/NotFoundPage'
import { DamageEstimator } from './DamageEstimator'
import { DqStatusBadge } from './DqStatusBadge'
import { Fact } from './Fact'
import { specialAttacks } from './specialAttacks'

type SkillDetail = components['schemas']['SkillDetail']

function SkillFacts({ skill }: { skill: SkillDetail }) {
  return (
    <dl className="grid grid-cols-2 gap-4 rounded border border-zinc-800 bg-zinc-900 p-4 sm:grid-cols-3 lg:grid-cols-5">
      <Fact term="Specs">{skill.specs.join(', ')}</Fact>
      <Fact term="Cooldown">{formatSeconds(skill.cooldown_ms)}</Fact>
      <Fact term="Crit rate">{formatPercent(skill.crit_rate)}</Fact>
      <Fact term="Down / air">{specialAttacks(skill)}</Fact>
      <Fact term="Max targets">{skill.max_targets ?? '—'}</Fact>
      <Fact term="PvP CC">{skill.pvp_cc.join(', ') || '—'}</Fact>
      <Fact term="PvP damage ×">{formatNumber(skill.pvp_damage_multiplier)}</Fact>
      <Fact term="Total damage ×">{formatNumber(skill.total_damage_multiplier)}</Fact>
      <Fact term="DQ status">
        <DqStatusBadge status={skill.dq_status} />
      </Fact>
    </dl>
  )
}

const numberCell = 'py-2 pr-4 text-right tabular-nums'
const headerCell = 'py-2 pr-4 font-medium'

function ClausesTable({ clauses }: { clauses: SkillDetail['clauses'] }) {
  if (clauses.length === 0) return <p className="text-zinc-400">This skill has no damage clause.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="mb-2 text-left text-lg font-medium text-white">Damage clauses</caption>
        <thead className="text-left text-zinc-400">
          <tr className="border-b border-zinc-800">
            <th scope="col" className={`${headerCell} text-right`}>
              #
            </th>
            <th scope="col" className={headerCell}>
              Clause
            </th>
            <th scope="col" className={headerCell}>
              Macro
            </th>
            <th scope="col" className={`${headerCell} text-right`}>
              Damage ×
            </th>
            <th scope="col" className={`${headerCell} text-right`}>
              Hits
            </th>
            <th scope="col" className={`${headerCell} text-right`}>
              PvP kept
            </th>
            <th scope="col" className={`${headerCell} text-right`}>
              PvP damage ×
            </th>
            <th scope="col" className={`${headerCell} text-right`}>
              Crit rate
            </th>
            <th scope="col" className={headerCell}>
              DQ flag
            </th>
          </tr>
        </thead>
        <tbody>
          {clauses.map((clause) => (
            <tr key={clause.clause_index} className="border-b border-zinc-900">
              <td className={numberCell}>{clause.clause_index}</td>
              <td className="py-2 pr-4">{clause.clause_label}</td>
              <td className="py-2 pr-4 font-mono text-xs">{clause.macro}</td>
              <td className={numberCell}>{formatNumber(clause.damage_multiplier)}</td>
              <td className={numberCell}>{clause.hits}</td>
              <td className={numberCell}>{formatPercent(clause.pvp_kept_ratio)}</td>
              <td className={numberCell}>{formatNumber(clause.pvp_damage_multiplier)}</td>
              <td className={numberCell}>{formatPercent(clause.crit_rate)}</td>
              <td className="py-2 text-amber-300">{clause.dq_flag ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SkillContent({ classSlug, skillId }: { classSlug: string; skillId: number }) {
  const { data, error, isPending } = useQuery(skillQuery(useApiClient(), classSlug, skillId))

  if (isPending) return <Loading what="skill" />
  if (error) return <ErrorState error={error} />
  return (
    <>
      <h1 className="text-2xl font-semibold">{data.skill_name}</h1>
      <SkillFacts skill={data} />
      <ClausesTable clauses={data.clauses} />
      {data.pve_only_cc.length > 0 && (
        <p className="text-sm text-zinc-400">
          These CC only apply in PvE: {data.pve_only_cc.join(', ')}
        </p>
      )}
      <DamageEstimator key={`${classSlug}/${skillId}`} classSlug={classSlug} skillId={skillId} />
    </>
  )
}

export function SkillDetailPage() {
  const { classSlug = '', skillId = '' } = useParams()
  if (!/^[1-9]\d*$/.test(skillId)) return <NotFoundPage />

  return (
    <section className="space-y-6">
      <Link to={`/classes/${classSlug}`} className="text-sm text-sky-400 hover:text-sky-300">
        Back to {classSlug} skills
      </Link>
      <SkillContent classSlug={classSlug} skillId={Number(skillId)} />
    </section>
  )
}
