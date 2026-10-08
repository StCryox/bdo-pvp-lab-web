import type { FormEvent } from 'react'
import { type DamageEstimateRequest, useEstimateDamage } from '../../api/queries'
import type { components } from '../../api/schema'
import { ErrorState } from '../../components/ErrorState'
import { formatNumber, formatPercent } from '../../format'
import { Fact } from './Fact'

type DamageEstimate = components['schemas']['DamageEstimate']
type DamageClause = components['schemas']['DamageClause']
type ClauseEstimate = components['schemas']['ClauseEstimate']
type TargetState = components['schemas']['Situation']['target_state']

const inputClass =
  'w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-right tabular-nums'

interface NumberFieldProps {
  label: string
  name: string
  defaultValue: number
  step?: number
  max?: number
  min?: number
}

function NumberField({ label, name, defaultValue, step = 1, min = 0, max }: NumberFieldProps) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-zinc-400">{label}</span>
      <input
        type="number"
        name={name}
        defaultValue={defaultValue}
        step={step}
        min={min}
        max={max}
        required
        className={inputClass}
      />
    </label>
  )
}

function CheckboxField({ label, name }: { label: string; name: string }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} className="accent-sky-500" />
      {label}
    </label>
  )
}

function toRequest(classSlug: string, skillId: number, form: FormData): DamageEstimateRequest {
  const number = (name: string) => Number(form.get(name))
  return {
    class_slug: classSlug,
    skill_id: skillId,
    attacker: {
      ap: number('ap'),
      accuracy: number('accuracy'),
      crit_damage_bonus: number('crit_damage_bonus'),
      back_attack_bonus: number('back_attack_bonus'),
      down_attack_bonus: number('down_attack_bonus'),
      air_attack_bonus: number('air_attack_bonus'),
    },
    defender: {
      dr: number('dr'),
      evasion: number('evasion'),
      super_armor_dr_rate: number('super_armor_dr_rate'),
    },
    situation: {
      target_state: form.get('target_state') as TargetState,
      from_behind: form.has('from_behind'),
      target_in_super_armor: form.has('target_in_super_armor'),
      pvp_modifier: number('pvp_modifier'),
    },
  }
}

const clauseKey = (clause: Pick<DamageClause, 'source_order' | 'clause_index'>) =>
  `${clause.source_order}-${clause.clause_index}`

function inclusion(clause: ClauseEstimate, aliasKeys: Set<string>): string {
  if (clause.included) return 'Yes'
  return aliasKeys.has(clauseKey(clause)) ? 'No (selector alias)' : 'No'
}

function EstimateResult({
  estimate,
  clauses,
}: {
  estimate: DamageEstimate
  clauses: DamageClause[]
}) {
  const aliasKeys = new Set(clauses.filter((c) => c.is_selector_alias).map(clauseKey))
  return (
    <div className="space-y-4">
      <p>
        <span className="block text-sm text-zinc-400">Total expected HP loss</span>
        <span className="text-3xl font-semibold tabular-nums">
          {formatNumber(estimate.total_expected_hp_loss)}
        </span>
      </p>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Fact term="Hit rate">{formatPercent(estimate.hit_rate)}</Fact>
        <Fact term="Base damage">{formatNumber(estimate.base_damage)}</Fact>
        <Fact term="DR rate">{formatPercent(estimate.damage_reduction_rate)}</Fact>
        <Fact term="Special attack">
          {estimate.special_attack} × {formatNumber(estimate.special_multiplier)}
        </Fact>
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

const fieldsetClass = 'space-y-3 rounded border border-zinc-800 p-4'
const legendClass = 'px-1 font-medium text-white'

interface DamageEstimatorProps {
  classSlug: string
  skillId: number
  clauses: DamageClause[]
}

export function DamageEstimator({ classSlug, skillId, clauses }: DamageEstimatorProps) {
  const { mutate, data, error, isPending } = useEstimateDamage()

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    mutate(toRequest(classSlug, skillId, new FormData(event.currentTarget)))
  }

  return (
    <section aria-labelledby="estimator-title" className="space-y-4">
      <h2 id="estimator-title" className="text-lg font-medium">
        Damage estimator
      </h2>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <fieldset className={fieldsetClass}>
            <legend className={legendClass}>Attacker</legend>
            <NumberField label="AP" name="ap" defaultValue={1085} />
            <NumberField label="Accuracy" name="accuracy" defaultValue={1353} />
            <NumberField
              label="Crit damage bonus (0.2 = +20%)"
              name="crit_damage_bonus"
              defaultValue={0.2}
              step={0.01}
            />
            <NumberField
              label="Back attack bonus"
              name="back_attack_bonus"
              defaultValue={0}
              step={0.01}
            />
            <NumberField
              label="Down attack bonus"
              name="down_attack_bonus"
              defaultValue={0}
              step={0.01}
            />
            <NumberField
              label="Air attack bonus"
              name="air_attack_bonus"
              defaultValue={0}
              step={0.01}
            />
          </fieldset>
          <fieldset className={fieldsetClass}>
            <legend className={legendClass}>Defender</legend>
            <NumberField label="DR" name="dr" defaultValue={740} />
            <NumberField label="Evasion" name="evasion" defaultValue={1197} />
            <NumberField
              label="Super armor DR rate"
              name="super_armor_dr_rate"
              defaultValue={0.1}
              step={0.01}
              max={0.7}
            />
          </fieldset>
          <fieldset className={fieldsetClass}>
            <legend className={legendClass}>Situation</legend>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-400">Target state</span>
              <select
                name="target_state"
                defaultValue="downed"
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1"
              >
                <option value="standing">Standing</option>
                <option value="downed">Downed</option>
                <option value="airborne">Airborne</option>
              </select>
            </label>
            <CheckboxField label="From behind" name="from_behind" />
            <CheckboxField label="Target in super armor" name="target_in_super_armor" />
            <NumberField
              label="PvP modifier"
              name="pvp_modifier"
              defaultValue={1}
              step={0.01}
              min={1}
              max={1.1}
            />
          </fieldset>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          Estimate damage
        </button>
      </form>
      {error && <ErrorState error={error} />}
      {data && <EstimateResult estimate={data} clauses={clauses} />}
    </section>
  )
}
