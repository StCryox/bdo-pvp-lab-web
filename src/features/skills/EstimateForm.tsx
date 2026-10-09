import type { SubmitEvent } from 'react'
import type { DamageEstimateRequest } from '../../api/queries'
import type { components } from '../../api/schema'

export type EstimateInputs = Omit<DamageEstimateRequest, 'class_slug' | 'skill_id' | 'variant'>

type TargetState = components['schemas']['Situation']['target_state']

const inputClass =
  'w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-right tabular-nums'

interface NumberFieldProps {
  label: string
  name: string
  defaultValue: number
  step?: number | 'any'
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

// The form shows rates and bonuses in %, the API takes fractions.
function toInputs(form: FormData): EstimateInputs {
  const number = (name: string) => Number(form.get(name))
  const fraction = (name: string) => number(name) / 100
  return {
    attacker: {
      ap: number('ap'),
      accuracy: number('accuracy'),
      crit_rate_bonus: fraction('crit_rate_bonus'),
      crit_damage_bonus: fraction('crit_damage_bonus'),
      back_attack_bonus: fraction('back_attack_bonus'),
      down_attack_bonus: fraction('down_attack_bonus'),
      air_attack_bonus: fraction('air_attack_bonus'),
    },
    defender: {
      dr: number('dr'),
      evasion: number('evasion'),
      super_armor_dr_rate: fraction('super_armor_dr_rate'),
    },
    situation: {
      target_state: form.get('target_state') as TargetState,
      from_behind: form.has('from_behind'),
      target_in_super_armor: form.has('target_in_super_armor'),
      pvp_modifier: number('pvp_modifier'),
    },
  }
}

const fieldsetClass = 'space-y-3 rounded border border-zinc-800 p-4'
const legendClass = 'px-1 font-medium text-white'

interface EstimateFormProps {
  onSubmit: (inputs: EstimateInputs) => void
  pending?: boolean
  submitLabel: string
}

export function EstimateForm({ onSubmit, pending = false, submitLabel }: EstimateFormProps) {
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(toInputs(new FormData(event.currentTarget)))
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Attacker</legend>
          <NumberField label="AP" name="ap" defaultValue={1085} />
          <NumberField label="Accuracy" name="accuracy" defaultValue={1353} />
          <NumberField
            label="Crit rate bonus (%)"
            name="crit_rate_bonus"
            defaultValue={0}
            step="any"
            max={100}
          />
          <NumberField
            label="Crit damage bonus (%)"
            name="crit_damage_bonus"
            defaultValue={20}
            step="any"
          />
          <NumberField
            label="Back attack bonus (%)"
            name="back_attack_bonus"
            defaultValue={0}
            step="any"
          />
          <NumberField
            label="Down attack bonus (%)"
            name="down_attack_bonus"
            defaultValue={0}
            step="any"
          />
          <NumberField
            label="Air attack bonus (%)"
            name="air_attack_bonus"
            defaultValue={0}
            step="any"
          />
        </fieldset>
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Defender</legend>
          <NumberField label="DR" name="dr" defaultValue={740} />
          <NumberField label="Evasion" name="evasion" defaultValue={1197} />
          <NumberField
            label="Super armor DR rate (%)"
            name="super_armor_dr_rate"
            defaultValue={10}
            step="any"
            max={70}
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
        disabled={pending}
        className="rounded bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500 disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </form>
  )
}
