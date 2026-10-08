import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { useApiClient } from '../../api/apiContext'
import { classesQuery } from '../../api/queries'
import { ErrorState } from '../../components/ErrorState'
import { Loading } from '../../components/Loading'

function ClassGrid() {
  const { data, error, isPending } = useQuery(classesQuery(useApiClient()))

  if (isPending) return <Loading what="classes" />
  if (error) return <ErrorState error={error} />
  if (data.length === 0) return <p className="text-zinc-400">No class in this extract.</p>
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((playerClass) => (
        <li key={playerClass.class_slug}>
          <Link
            to={`/classes/${playerClass.class_slug}`}
            className="block rounded border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-600"
          >
            <span className="block text-lg font-medium text-white">{playerClass.class_name}</span>
            <span className="block text-sm text-zinc-400">{playerClass.specs.join(', ')}</span>
            <span className="block text-sm text-zinc-500">{playerClass.skill_count} skills</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function ClassesPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Classes</h1>
      <ClassGrid />
    </section>
  )
}
