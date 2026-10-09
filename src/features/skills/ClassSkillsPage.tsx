import { type UseQueryResult, useQueries, useQuery } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useApiClient } from '../../api/apiContext'
import { classSkillsQuery, classesQuery, damageEstimateQuery } from '../../api/queries'
import type { components } from '../../api/schema'
import { ErrorState } from '../../components/ErrorState'
import { Loading } from '../../components/Loading'
import { formatNumber, formatPercent, formatSeconds } from '../../format'
import { EXPECTED_HP_LOSS_MEANING } from './DamageEstimator'
import { DqStatusBadge } from './DqStatusBadge'
import { EstimateForm, type EstimateInputs } from './EstimateForm'
import { specialAttacks } from './specialAttacks'
import { Tooltip } from './Tooltip'

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

type DamageEstimate = components['schemas']['DamageEstimate']
type SkillSummary = components['schemas']['SkillSummary']
type SkillVariant = components['schemas']['SkillVariant']
type Estimate = UseQueryResult<DamageEstimate> | undefined

const numberCell = 'py-2 pr-4 text-right tabular-nums'

function EstimateCells({ estimate }: { estimate: Estimate }) {
  const data = estimate?.data
  const pending = estimate !== undefined && estimate.isEnabled && estimate.isPending
  const values = data
    ? [data.total_hp_loss_no_crit, data.total_hp_loss_crit, data.total_expected_hp_loss].map(
        (value) => formatNumber(value),
      )
    : Array<string>(3).fill(pending ? '…' : '—')
  return values.map((value, index) => (
    <td key={index} className={numberCell} title={estimate?.error?.message}>
      {value}
    </td>
  ))
}

interface Row {
  skill: SkillSummary
  variant: SkillVariant | undefined
  estimate: Estimate
}

const sortValues = {
  pvp: ({ skill, variant }: Row) => (variant ?? skill).pvp_damage_multiplier,
  total: ({ skill, variant }: Row) => (variant ?? skill).total_damage_multiplier,
  critRate: ({ skill }: Row) => skill.crit_rate,
  noCrit: ({ estimate }: Row) => estimate?.data?.total_hp_loss_no_crit,
  crit: ({ estimate }: Row) => estimate?.data?.total_hp_loss_crit,
  expected: ({ estimate }: Row) => estimate?.data?.total_expected_hp_loss,
} satisfies Record<string, (row: Row) => number | null | undefined>

type SortColumn = keyof typeof sortValues
type SortDirection = 'descending' | 'ascending'
interface Sort {
  column: SortColumn
  direction: SortDirection
}

// Rows without a value stay last, in API order, whatever the direction.
function sortRows(rows: Row[], sort: Sort | undefined): Row[] {
  if (sort === undefined) return rows
  const value = sortValues[sort.column]
  const direction = sort.direction === 'descending' ? -1 : 1
  return rows.toSorted((a, b) => {
    const valueA = value(a) ?? undefined
    const valueB = value(b) ?? undefined
    if (valueA === undefined || valueB === undefined) {
      return Number(valueA === undefined) - Number(valueB === undefined)
    }
    return (valueA - valueB) * direction
  })
}

// A first click sorts highest first, the next ones toggle the direction.
const nextSort = (sort: Sort | undefined, column: SortColumn): Sort => ({
  column,
  direction:
    sort?.column === column && sort.direction === 'descending' ? 'ascending' : 'descending',
})

interface SortableHeaderProps {
  label: string
  column: SortColumn
  sort: Sort | undefined
  onSort: (column: SortColumn) => void
  children?: ReactNode
}

function SortableHeader({ label, column, sort, onSort, children }: SortableHeaderProps) {
  const direction = sort?.column === column ? sort.direction : undefined
  return (
    <th
      scope="col"
      aria-sort={direction}
      className="py-2 pr-4 text-right font-medium whitespace-nowrap"
    >
      <button type="button" onClick={() => onSort(column)} className="font-medium hover:text-white">
        {label}
        {direction && <span aria-hidden="true">{direction === 'descending' ? ' ↓' : ' ↑'}</span>}
      </button>
      {children}
    </th>
  )
}

// BR-PVP-05: one row per variant, a skill without damage keeps one row.
const variantRows = (skills: SkillSummary[]) =>
  skills.flatMap((skill) =>
    skill.variants.length === 0
      ? [{ skill, variant: undefined }]
      : skill.variants.map((variant: SkillVariant | undefined) => ({ skill, variant })),
  )

const rowName = (skill: SkillSummary, variant: SkillVariant | undefined) =>
  variant && skill.variants.length > 1
    ? `${skill.skill_name} · variant ${variant.variant}`
    : skill.skill_name

interface SkillsTableProps {
  classSlug: string
  spec: string | undefined
  estimateInputs: EstimateInputs | undefined
  nameFilter: string
}

const matchesName = (skill: SkillSummary, filter: string) =>
  skill.skill_name.toLowerCase().includes(filter.trim().toLowerCase())

function SkillsTable({ classSlug, spec, estimateInputs, nameFilter }: SkillsTableProps) {
  const client = useApiClient()
  const { data, error, isPending } = useQuery(classSkillsQuery(client, classSlug, spec))
  const skillRows = variantRows(data ?? [])
  const estimates = useQueries({
    queries:
      estimateInputs === undefined
        ? []
        : skillRows.map(({ skill, variant }) => ({
            ...damageEstimateQuery(client, {
              ...estimateInputs,
              class_slug: classSlug,
              skill_id: skill.skill_id,
              variant: variant?.variant ?? 1,
            }),
            enabled: variant !== undefined && variant.pvp_damage_multiplier != null,
          })),
  })
  const [sort, setSort] = useState<Sort>()
  const sortBy = (column: SortColumn) => setSort(nextSort(sort, column))

  if (isPending) return <Loading what="skills" />
  if (error) return <ErrorState error={error} />
  if (data.length === 0) return <p className="text-zinc-400">No skill for this spec.</p>
  const rows = sortRows(
    skillRows
      .map((row, index) => ({ ...row, estimate: estimates[index] }))
      .filter(({ skill }) => matchesName(skill, nameFilter)),
    sort,
  )
  if (rows.length === 0) {
    return <p className="text-zinc-400">No skill matches “{nameFilter}”.</p>
  }
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
            <SortableHeader label="PvP damage ×" column="pvp" sort={sort} onSort={sortBy} />
            <SortableHeader label="Total damage ×" column="total" sort={sort} onSort={sortBy} />
            <SortableHeader label="Crit rate" column="critRate" sort={sort} onSort={sortBy} />
            <th scope="col" className="py-2 pr-4 font-medium">
              Down / air
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              PvP CC
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              DQ
            </th>
            {estimateInputs && (
              <>
                <SortableHeader label="No crit" column="noCrit" sort={sort} onSort={sortBy} />
                <SortableHeader label="Crit" column="crit" sort={sort} onSort={sortBy} />
                <SortableHeader
                  label="Expected HP loss"
                  column="expected"
                  sort={sort}
                  onSort={sortBy}
                >
                  {' '}
                  <Tooltip text={EXPECTED_HP_LOSS_MEANING} label="About expected HP loss">
                    <span aria-hidden="true">ⓘ</span>
                  </Tooltip>
                </SortableHeader>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ skill, variant, estimate }) => {
            const damage = variant ?? skill
            return (
              <tr
                key={`${skill.skill_id}-${variant?.variant ?? 0}`}
                className="border-b border-zinc-900 hover:bg-zinc-900"
              >
                <td className="py-2 pr-4">
                  <Link
                    to={`/classes/${classSlug}/skills/${skill.skill_id}`}
                    className="text-sky-400 hover:text-sky-300"
                  >
                    {rowName(skill, variant)}
                  </Link>
                </td>
                <td className={numberCell}>{formatSeconds(skill.cooldown_ms)}</td>
                <td className={numberCell}>{formatNumber(damage.pvp_damage_multiplier)}</td>
                <td className={numberCell}>{formatNumber(damage.total_damage_multiplier)}</td>
                <td className={numberCell}>{formatPercent(skill.crit_rate)}</td>
                <td className="py-2 pr-4">{specialAttacks(skill)}</td>
                <td className="py-2 pr-4">{skill.pvp_cc.join(', ') || '—'}</td>
                <td className="py-2 pr-4">
                  <DqStatusBadge status={skill.dq_status} />
                </td>
                {estimateInputs && <EstimateCells estimate={estimate} />}
              </tr>
            )
          })}
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
  const [estimateInputs, setEstimateInputs] = useState<EstimateInputs>()
  const [nameFilter, setNameFilter] = useState('')

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{playerClass?.class_name ?? classSlug}</h1>
      {playerClass && <SpecTabs specs={playerClass.specs} current={spec} />}
      <details className="rounded border border-zinc-800 p-4">
        <summary className="cursor-pointer font-medium">Estimate against a target</summary>
        <div className="mt-4">
          <EstimateForm onSubmit={setEstimateInputs} submitLabel="Estimate all skills" />
        </div>
      </details>
      <label className="block max-w-xs text-sm">
        <span className="mb-1 block text-zinc-400">Skill name</span>
        <input
          type="search"
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
          placeholder="Wave Orb"
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1"
        />
      </label>
      <SkillsTable
        classSlug={classSlug}
        spec={spec}
        estimateInputs={estimateInputs}
        nameFilter={nameFilter}
      />
    </section>
  )
}
