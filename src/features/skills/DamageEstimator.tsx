import { useState } from 'react'
import { useEstimateDamage } from '../../api/queries'
import type { components } from '../../api/schema'
import { ErrorState } from '../../components/ErrorState'
import { formatNumber, formatPercent } from '../../format'
import { EstimateForm } from './EstimateForm'
import { Fact } from './Fact'
import { Tooltip } from './Tooltip'

type DamageEstimate = components['schemas']['DamageEstimate']
type DamageClause = components['schemas']['DamageClause']
type ClauseEstimate = components['schemas']['ClauseEstimate']
type SkillVariant = components['schemas']['SkillVariant']

export const EXPECTED_HP_LOSS_MEANING =
  'Average HP lost per cast: No crit × (1 − crit rate) + Crit × crit rate. Crit rate = skill PvP crit rate + your bonus, max 100%.'

const clauseKey = (clause: Pick<DamageClause, 'source_order' | 'clause_index'>) =>
  `${clause.source_order}-${clause.clause_index}`

function inclusion(clause: ClauseEstimate, aliasKeys: Set<string>): string {
  if (clause.included) return 'Yes'
  return aliasKeys.has(clauseKey(clause)) ? 'No (selector alias)' : 'No'
}

interface EstimateResultProps {
  estimate: DamageEstimate
  critRate: number | null | undefined
  clauses: DamageClause[]
}

function EstimateResult({ estimate, critRate, clauses }: EstimateResultProps) {
  const aliasKeys = new Set(clauses.filter((c) => c.is_selector_alias).map(clauseKey))
  return (
    <div className="space-y-4">
      <p>
        <span className="block text-sm text-zinc-400">
          Total expected HP loss{' '}
          <Tooltip text={EXPECTED_HP_LOSS_MEANING} label="About expected HP loss">
            <span aria-hidden="true">ⓘ</span>
          </Tooltip>
        </span>
        <span className="text-3xl font-semibold tabular-nums">
          {formatNumber(estimate.total_expected_hp_loss)}
        </span>
      </p>
      <dl className="grid grid-cols-2 gap-4">
        <Fact term="No crit">{formatNumber(estimate.total_hp_loss_no_crit)}</Fact>
        <Fact term="Crit">{formatNumber(estimate.total_hp_loss_crit)}</Fact>
      </dl>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        <Fact term="Hit rate">{formatPercent(estimate.hit_rate)}</Fact>
        <Fact term="Base damage">{formatNumber(estimate.base_damage)}</Fact>
        <Fact term="DR rate">{formatPercent(estimate.damage_reduction_rate)}</Fact>
        <Fact term="Special attack">
          {estimate.special_attack} × {formatNumber(estimate.special_multiplier)}
        </Fact>
        <Fact term="Crit rate">{formatPercent(critRate)}</Fact>
        <Fact term="Expected crit ×">{formatNumber(estimate.expected_crit_multiplier)}</Fact>
        <Fact term="PvP modifier">{formatNumber(estimate.pvp_modifier)}</Fact>
      </dl>
      <table className="w-full text-sm">
        <caption className="mb-2 text-left font-medium text-white">
          Expected HP loss per clause
        </caption>
        <thead className="text-left text-zinc-400">
          <tr className="border-b border-zinc-800">
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              #
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Clause
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Included
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              No crit
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              Crit
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Expected HP loss
            </th>
          </tr>
        </thead>
        <tbody>
          {estimate.clauses.map((clause) => (
            <tr key={clauseKey(clause)} className="border-b border-zinc-900">
              <td className="py-2 pr-4 text-right tabular-nums">{clause.clause_index}</td>
              <td className="py-2 pr-4">{clause.clause_label}</td>
              <td className="py-2 pr-4">{inclusion(clause, aliasKeys)}</td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatNumber(clause.hp_loss_no_crit)}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatNumber(clause.hp_loss_crit)}
              </td>
              <td className="py-2 text-right tabular-nums">
                {formatNumber(clause.expected_hp_loss)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {estimate.warnings.length > 0 && (
        <ul aria-label="Warnings" className="list-inside list-disc text-sm text-amber-300">
          {estimate.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface DamageEstimatorProps {
  classSlug: string
  skillId: number
  critRate: number | null | undefined
  variants: SkillVariant[]
  clauses: DamageClause[]
}

export function DamageEstimator({
  classSlug,
  skillId,
  critRate,
  variants,
  clauses,
}: DamageEstimatorProps) {
  const { mutate, data, error, isPending } = useEstimateDamage()
  const [variant, setVariant] = useState(1)

  return (
    <section aria-labelledby="estimator-title" className="space-y-4">
      <h2 id="estimator-title" className="text-lg font-medium">
        Damage estimator
      </h2>
      {variants.length > 1 && (
        <label className="block max-w-xs text-sm">
          <span className="mb-1 block text-zinc-400">Variant</span>
          <select
            value={variant}
            onChange={(event) => setVariant(Number(event.target.value))}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1"
          >
            {variants.map(({ variant: value }) => (
              <option key={value} value={value}>
                Variant {value}
              </option>
            ))}
          </select>
        </label>
      )}
      <EstimateForm
        onSubmit={(inputs) =>
          mutate({ class_slug: classSlug, skill_id: skillId, variant, ...inputs })
        }
        pending={isPending}
        submitLabel="Estimate damage"
      />
      {error && <ErrorState error={error} />}
      {data && <EstimateResult estimate={data} critRate={critRate} clauses={clauses} />}
    </section>
  )
}
