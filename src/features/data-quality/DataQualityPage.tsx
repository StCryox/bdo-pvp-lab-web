import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useApiClient } from '../../api/apiContext'
import {
  type IssueFilters,
  classesQuery,
  dataQualityIssuesQuery,
  dataQualityQuery,
} from '../../api/queries'
import type { components } from '../../api/schema'
import { Badge, type BadgeTone } from '../../components/Badge'
import { ErrorState } from '../../components/ErrorState'
import { Loading } from '../../components/Loading'

type Severity = components['schemas']['Severity']

const PAGE_SIZE = 20
const SEVERITIES: Severity[] = ['error', 'warning', 'info']

const severityDisplay: Record<Severity, { tone: BadgeTone; label: string }> = {
  error: { tone: 'danger', label: 'Error' },
  warning: { tone: 'warning', label: 'Warning' },
  info: { tone: 'neutral', label: 'Info' },
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const { tone, label } = severityDisplay[severity]
  return <Badge tone={tone}>{label}</Badge>
}

const isSeverity = (value: string | null): value is Severity =>
  SEVERITIES.includes(value as Severity)

const headerCell = 'py-2 pr-4 font-medium'

function Report() {
  const { data, error, isPending } = useQuery(dataQualityQuery(useApiClient()))

  if (isPending) return <Loading what="data quality report" />
  if (error) return <ErrorState error={error} />
  const rules = data.rules.toSorted(
    (a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity),
  )
  return (
    <>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {data.metrics.map((metric) => (
          <div key={metric.metric} className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <dt className="text-sm text-zinc-400">{metric.label}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{metric.value}</dd>
          </div>
        ))}
      </dl>
      <table className="w-full max-w-xl text-sm">
        <caption className="mb-2 text-left text-lg font-medium text-white">Issues per rule</caption>
        <thead className="text-left text-zinc-400">
          <tr className="border-b border-zinc-800">
            <th scope="col" className={headerCell}>
              Severity
            </th>
            <th scope="col" className={headerCell}>
              Rule
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Issues
            </th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.rule} className="border-b border-zinc-900">
              <td className="py-2 pr-4">
                <SeverityBadge severity={rule.severity} />
              </td>
              <td className="py-2 pr-4 font-mono text-xs">{rule.rule}</td>
              <td className="py-2 text-right tabular-nums">{rule.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-zinc-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1"
      >
        {children}
      </select>
    </label>
  )
}

function IssueFiltersForm({
  filters,
  onChange,
}: {
  filters: IssueFilters
  onChange: (param: string, value: string) => void
}) {
  const client = useApiClient()
  const { data: report } = useQuery(dataQualityQuery(client))
  const { data: classes } = useQuery(classesQuery(client))

  return (
    <div className="flex flex-wrap gap-4">
      <Select label="Rule" value={filters.rule ?? ''} onChange={(v) => onChange('rule', v)}>
        <option value="">All rules</option>
        {report?.rules.map(({ rule }) => (
          <option key={rule} value={rule}>
            {rule}
          </option>
        ))}
      </Select>
      <Select
        label="Severity"
        value={filters.severity ?? ''}
        onChange={(v) => onChange('severity', v)}
      >
        <option value="">All severities</option>
        {SEVERITIES.map((severity) => (
          <option key={severity} value={severity}>
            {severityDisplay[severity].label}
          </option>
        ))}
      </Select>
      <Select label="Class" value={filters.class_slug ?? ''} onChange={(v) => onChange('class', v)}>
        <option value="">All classes</option>
        {classes?.map((c) => (
          <option key={c.class_slug} value={c.class_slug}>
            {c.class_name}
          </option>
        ))}
      </Select>
    </div>
  )
}

function IssuesTable({
  filters,
  onOffsetChange,
}: {
  filters: IssueFilters
  onOffsetChange: (offset: number) => void
}) {
  const { data, error, isPending } = useQuery(dataQualityIssuesQuery(useApiClient(), filters))

  if (isPending) return <Loading what="issues" />
  if (error) return <ErrorState error={error} />
  if (data.items.length === 0)
    return <p className="text-zinc-400">No issue matches these filters.</p>
  const last = Math.min(data.offset + data.limit, data.total)
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Issues</caption>
          <thead className="text-left text-zinc-400">
            <tr className="border-b border-zinc-800">
              <th scope="col" className={headerCell}>
                Severity
              </th>
              <th scope="col" className={headerCell}>
                Rule
              </th>
              <th scope="col" className={headerCell}>
                Class
              </th>
              <th scope="col" className={`${headerCell} text-right`}>
                Skill
              </th>
              <th scope="col" className="py-2 font-medium">
                Detail
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((issue) => (
              <tr key={issue.issue_id} className="border-b border-zinc-900">
                <td className="py-2 pr-4">
                  <SeverityBadge severity={issue.severity} />
                </td>
                <td className="py-2 pr-4 font-mono text-xs">{issue.rule}</td>
                <td className="py-2 pr-4">{issue.class_slug ?? '—'}</td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {issue.class_slug != null && issue.skill_id != null ? (
                    <Link
                      to={`/classes/${issue.class_slug}/skills/${issue.skill_id}`}
                      className="text-sky-400 hover:text-sky-300"
                    >
                      {issue.skill_id}
                    </Link>
                  ) : (
                    (issue.skill_id ?? '—')
                  )}
                </td>
                <td className="py-2">{issue.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          disabled={data.offset === 0}
          onClick={() => onOffsetChange(Math.max(data.offset - data.limit, 0))}
          className="rounded border border-zinc-700 px-3 py-1 disabled:opacity-40"
        >
          Previous page
        </button>
        <span className="tabular-nums text-zinc-400">
          Issues {data.offset + 1}–{last} of {data.total}
        </span>
        <button
          type="button"
          disabled={last >= data.total}
          onClick={() => onOffsetChange(data.offset + data.limit)}
          className="rounded border border-zinc-700 px-3 py-1 disabled:opacity-40"
        >
          Next page
        </button>
      </div>
    </div>
  )
}

export function DataQualityPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const severity = searchParams.get('severity')
  const filters: IssueFilters = {
    rule: searchParams.get('rule') ?? undefined,
    severity: isSeverity(severity) ? severity : undefined,
    class_slug: searchParams.get('class') ?? undefined,
    limit: PAGE_SIZE,
    offset: Number(searchParams.get('offset')) || 0,
  }

  const updateParams = (changes: Record<string, string>) =>
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      for (const [param, value] of Object.entries(changes)) {
        if (value) next.set(param, value)
        else next.delete(param)
      }
      return next
    })

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Data quality</h1>
      <Report />
      <section aria-labelledby="issues-title" className="space-y-4">
        <h2 id="issues-title" className="text-lg font-medium">
          Issues
        </h2>
        <IssueFiltersForm
          filters={filters}
          onChange={(param, value) => updateParams({ [param]: value, offset: '' })}
        />
        <IssuesTable
          filters={filters}
          onOffsetChange={(offset) => updateParams({ offset: offset === 0 ? '' : String(offset) })}
        />
      </section>
    </section>
  )
}
